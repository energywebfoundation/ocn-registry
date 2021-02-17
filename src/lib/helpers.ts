import { cwd } from 'process'
import { join, isAbsolute } from 'path'
import { Network } from "../types/network"

export const getOverrides = (networkFileName?: string): Partial<Network> => {
    if (!networkFileName) {
        return {}
    }
    const networkFilePath = isAbsolute(networkFileName)
        ? networkFileName
        : join(cwd(), networkFileName)

    const network = require(networkFilePath)
    return network
}
