import yargs from 'yargs';
import Logger from '@exponentialworkload/logger';
import fs from 'fs';
Logger.postGuillemet = true;

type App = {
  id: number,
  domainId: number,
  name: string,
  type: string,
  status: string,
  origin: string,
  ipsAllowed: string[],
  ipsBlocked: string[],
  filterMode: string, // cba to make enum here
  ignoredURIs: string,
  requestsPerMinute: number,
  uriRateLimiting: {
    uri: string,
    interval: string
  }[],
  ipReputation: boolean
}

const token = process.env.NEXUSPIPE_TOKEN || (fs.existsSync('./token.txt') && fs.readFileSync('./token.txt', 'utf-8'));

if (!token)
  throw new Error('No token provided - Must put it in ./token.txt or the env variable NEXUSPIPE_TOKEN!');

(async () => {
  const logger = new Logger()
  const getSystemIp = () => fetch('https://nexuspipe.com/.nexus/ip').then(r => r.text())
  let sysip = await getSystemIp();
  const getApp = (app: string): Promise<{
    success: boolean | 1 | 0,
    result: App,
    error?: string,
  }> => fetch('https://api.nexuspipe.com/v1/app/' + app, {
    method: 'GET',
    headers: {
      'Authorization': token,
      'Auth': token,
      'Authentication': token,
    },
  }).then(r => r.json())
  const updateApp = async (app: string, data: Partial<App>): Promise<{
    success: 1,
  } | {
    success: 0,
    error: string,
  }> => {
    const v = await getApp(app);
    const r = await fetch('https://api.nexuspipe.com/v1/app/' + app, {
      method: 'PATCH',
      body: JSON.stringify({
        ...v.success && v.result || {},
        ...data
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'Auth': token,
        'Authentication': token,
      }
    });
    return await r.json();
  }
  const updateIp = async (app: string, port: number, proto: string = 'http') => {
    const ip = await getSystemIp()
    const appData = await getApp(app)
    if (!appData.success) {
      logger.error('Failed to get app data')
      return
    }
    const appDataResult: Partial<App> = appData.result
    appDataResult.origin = `${proto}://${ip}:${port}`
    delete appDataResult.domainId;
    delete appDataResult.name;
    delete appDataResult.type;
    delete appDataResult.id;
    const updateResult = await updateApp(app, appDataResult)

    if (!updateResult.success) {
      logger.error('Failed to update app data for ' + app + ': ' + updateResult.error ?? 'Unknown')
      logger.info('App data: ' + JSON.stringify(appDataResult))
      return
    }
    // verify update
    const updatedAppData = await getApp(app)
    if (!updatedAppData.success) {
      logger.error('Failed to get updated app data for ' + app + ': ' + updatedAppData.error ?? 'Unknown')
      return
    }
    if (updatedAppData.result.origin !== appDataResult.origin) {
      logger.error('Failed to verify updated app data - IP mismatch')
      return
    }
    logger.info('Updated app data for ' + app + '!')
  }
  yargs(process.argv.slice(2))
    .command('run', 'Run once', {
      apps: {
        alias: [
          'a',
          'app',
          'subdomains',
          's',
          'subdomain',
          'domains',
          'd',
          'domain'
        ],
        type: 'array',
        demandOption: true,
        description: 'Apps to update'
      },
    }, async (argv) => {
      const apps = argv.apps as string[]
      // make sure all apps are unique, excluding port - throw error if not
      apps.forEach((app, i) => {
        const [domain] = app.split(':')
        if (apps.slice(i + 1).some(v => v.split(':')[0] === domain)) {
          throw new Error('Duplicate domain found: ' + domain)
        }
      })
      for (const app of apps) {
        const [domain, port] = app.split(':')
        await updateIp(domain, Number(port))
      }
    })
    .command('spawn', 'Spawn on an interval', {
      apps: {
        alias: [
          'a',
          'app',
          'subdomains',
          's',
          'subdomain',
          'domains',
          'd',
          'domain'
        ],
        type: 'array',
        demandOption: true,
        description: 'Apps to update'
      },
      interval: {
        alias: [
          'i',
        ],
        type: 'number',
        description: 'Interval in minutes',
        default: 5
      },
      proto: {
        alias: [
          'p',
          'protocol',
        ],
        type: 'string',
        description: 'Protocol to use',
        default: 'http'
      },
    }, async (argv) => {
      const apps = argv.apps as string[]
      // make sure all apps are unique, excluding port - throw error if not
      apps.forEach((app, i) => {
        const [domain] = app.split(':')
        if (apps.slice(i + 1).some(v => v.split(':')[0] === domain)) {
          throw new Error('Duplicate domain found: ' + domain)
        }
      })
      const interval = argv.interval as number || 5
      const proto = argv.proto as string || 'http'
      const run = async () => {
        for (const app of apps) {
          const [domain, port] = app.split(':')
          await updateIp(domain, Number(port), proto)
        }
      }
      await run()
      setInterval(() => {
        // if the system ip changes, update all apps
        getSystemIp().then(ip => {
          if (ip !== sysip) {
            sysip = ip
            run()
          }
        });
      }, interval * 60 * 1000)
    })
    .help()
    .argv
})()