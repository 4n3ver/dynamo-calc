import runMain from "./lib/main-runner"
import main from "./lib/main"
import { cliGuide, cliDef } from "./lib/cli-args-definition"

runMain(cliGuide, cliDef, main)
