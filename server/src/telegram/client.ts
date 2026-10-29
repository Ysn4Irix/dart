import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { config, saveSessionToEnv } from '../config.js';

let clientInstance: TelegramClient | null = null;
let currentSessionString = config.telegram.sessionString;

/**
 * Returns the active Telegram client instance, initializing it if necessary
 */
export async function getTelegramClient(): Promise<TelegramClient | null> {
  if (clientInstance && clientInstance.connected) {
    return clientInstance;
  }

  if (!config.telegram.apiId || !config.telegram.apiHash) {
    return null;
  }

  const stringSession = new StringSession(currentSessionString);
  clientInstance = new TelegramClient(
    stringSession,
    config.telegram.apiId,
    config.telegram.apiHash,
    {
      connectionRetries: 5,
      useWSS: false,
      autoReconnect: true,
    }
  );

  await clientInstance.connect();

  const newSession = clientInstance.session.save() as unknown as string;
  if (newSession && newSession !== currentSessionString) {
    currentSessionString = newSession;
    saveSessionToEnv(newSession);
  }

  return clientInstance;
}

/**
 * Checks if the client has an authorized user session
 */
export async function isClientAuthorized(): Promise<boolean> {
  const client = await getTelegramClient();
  if (!client) return false;
  return await client.isUserAuthorized();
}

/**
 * Initiates the phone code login process
 */
export async function sendLoginCode(apiId: number, apiHash: string, phoneNumber: string) {
  config.telegram.apiId = apiId;
  config.telegram.apiHash = apiHash;

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  const { phoneCodeHash } = await client.sendCode(
    {
      apiId,
      apiHash,
    },
    phoneNumber
  );

  clientInstance = client;
  return { phoneCodeHash };
}

/**
 * Completes sign-in with phone code (and 2FA password if required)
 */
export async function completeSignIn(
  phoneNumber: string,
  phoneCodeHash: string,
  code: string,
  password?: string
) {
  if (!clientInstance) {
    throw new Error('Telegram client not initialized. Call sendLoginCode first.');
  }

  try {
    try {
      await clientInstance.invoke(
        new Api.auth.SignIn({
          phoneNumber,
          phoneCodeHash,
          phoneCode: code,
        })
      );
    } catch (err: unknown) {
      const error = err as { errorMessage?: string };
      if (error.errorMessage === 'SESSION_PASSWORD_NEEDED' && password) {
        await clientInstance.signInWithPassword(
          {
            apiId: config.telegram.apiId,
            apiHash: config.telegram.apiHash,
          },
          {
            password: async () => password,
            onError: (authErr) => {
              throw authErr;
            },
          }
        );
      } else {
        throw err;
      }
    }

    const sessionStr = clientInstance.session.save() as unknown as string;
    saveSessionToEnv(sessionStr, config.telegram.apiId, config.telegram.apiHash);
    return { success: true };
  } catch (error) {
    throw error;
  }
}
