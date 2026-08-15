/**
 * @pakka/chain — the ONLY web-facing chain integration layer (plan §6.1).
 *
 * Owns: the generated ABI (from Foundry artifacts, Prompt 03), chain config emitted from
 * deployments/<chainId>.json, and the pure confirmed-event reducer (Prompt 07). apps/web must import viem
 * clients, addresses, and ABIs from here and nowhere else.
 *
 * Populated from Prompt 07 onward. Kept as an explicit module so typecheck has a target.
 */
export const PACKAGE_NAME = "@pakka/chain" as const;
