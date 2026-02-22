import type { ConfigPlugin } from '@expo/config-plugins';
import { withXcodeProject } from '@expo/config-plugins';

const SCRIPT_PHASE_NAME = 'Bundle React Native code and images';
const NEEDLE = '`\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\"`';
const REPLACEMENT
  = 'RN_XCODE_SCRIPT=\\"$(\\"$NODE_BINARY\\" --print \\"require(\'path\').dirname(require.resolve(\'react-native/package.json\')) + \'/scripts/react-native-xcode.sh\'\\")\\"\\n\\"$RN_XCODE_SCRIPT\\"';

const withQuotedReactNativeXcodeScript: ConfigPlugin = config =>
  withXcodeProject(config, (configWithXcode) => {
    const project = configWithXcode.modResults;
    const phases = project.hash.project.objects.PBXShellScriptBuildPhase ?? {};

    for (const phase of Object.values(phases) as Array<Record<string, string>>) {
      if (!phase?.name || !phase?.shellScript) {
        continue;
      }

      const name = phase.name.replaceAll('"', '');
      if (name !== SCRIPT_PHASE_NAME) {
        continue;
      }

      if (!phase.shellScript.includes(NEEDLE) || phase.shellScript.includes('RN_XCODE_SCRIPT=')) {
        continue;
      }

      phase.shellScript = phase.shellScript.replace(NEEDLE, REPLACEMENT);
    }

    return configWithXcode;
  });

export default withQuotedReactNativeXcodeScript;
