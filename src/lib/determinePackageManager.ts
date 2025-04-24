import fs from 'fs/promises'
import { Index } from '../types/IndexType'
import { Options } from '../types/Options'
import { PackageManagerName } from '../types/PackageManagerName'
import findLockfile from './findLockfile'

// map lockfiles to package managers
const packageManagerLockfileMap: Index<PackageManagerName> = {
  'package-lock': 'npm',
  yarn: 'yarn',
  'pnpm-lock': 'pnpm',
  deno: 'deno',
  bun: 'bun',
}

/**
 * Get the package manager being used to run the command.
 * When checking global packages, we need to do it this way since there is no
 * lockfile in the global directory.
 */
const getRunningPackageManager = (): PackageManagerName => {
  const userAgent = process.env.npm_config_user_agent ?? ''
  const execpath = process.env.npm_execpath ?? ''

  if (
    userAgent.startsWith('yarn/') ||
    execpath.includes('yarn') ||
    __dirname.includes('/yarn/') ||
    __dirname.includes('\\Yarn\\')
  )
    return 'yarn'
  if (
    userAgent.startsWith('pnpm/') ||
    execpath.includes('pnpm') ||
    __dirname.includes('/pnpm/') ||
    __dirname.includes('\\pnpm\\')
  )
    return 'pnpm'
  if (
    userAgent.startsWith('bun/') ||
    typeof Bun !== 'undefined' ||
    process.versions.bun ||
    __dirname.includes('/.bun/') ||
    __dirname.includes('\\.bun\\')
  )
    return 'bun'

  return 'npm'
}

/**
 * If the packageManager option was not provided, look at the lockfiles to
 * determine which package manager is being used.
 */
const determinePackageManager = async (
  options: Options,
  // only for testing
  readdir: (_path: string) => Promise<string[]> = fs.readdir,
): Promise<PackageManagerName> => {
  if (options.packageManager) return options.packageManager
  else if (options.global) return getRunningPackageManager()

  const lockfileName = (await findLockfile(options, readdir))?.filename
  return lockfileName ? packageManagerLockfileMap[lockfileName.split('.')[0]] : 'npm'
}

export default determinePackageManager
