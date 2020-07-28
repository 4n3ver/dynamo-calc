import cliArgs, { CommandLineOptions, OptionDefinition } from "command-line-args"
import cliUsages, { Section } from "command-line-usage"

const getArgs: (optsDef: OptionDefinition[]) => CommandLineOptions | undefined =
    optsDef => {
        try {
            return cliArgs(optsDef)
        } catch (e) {
            console.error(`Error parsing arguments: ${e.message}\n${e.stack}`)
            return undefined
        }
    }

const runMain: (optsGuide: Section[], optsDef: OptionDefinition[], main: (opts: CommandLineOptions) => Promise<any>) => Promise<void> =
    async (optsGuide, optsDef, main) => {
        const usageGuide = cliUsages(optsGuide)
        try {
            const args = getArgs(optsDef)
            if (args && !args.help) {
                await main(args)
            } else {
                console.log(usageGuide)
            }
        } catch (e) {
            console.error(`Failed to calculate cost with error: ${e.message}\n${e.stack}`)
        }
    }

export default runMain
