import { createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const targetChain = hardhat;

export const config = createConfig({
  chains: [targetChain],
  connectors: [
    injected({
      shimDisconnect: true,
      unstable_shimAsyncInject: 2_000,
    }),
  ],
  // A second EIP-6963 connector shares MetaMask's provider and makes the
  // popup fail with "Connector already connected".
  multiInjectedProviderDiscovery: false,
  ssr: true,
  transports: {
    [targetChain.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"
    ),
  },
});
