import { useVault } from "../../context/VaultContext.jsx";
import VaultSetupView from "./VaultSetupView.jsx";
import VaultUnlockView from "./VaultUnlockView.jsx";

export default function VaultUnlockOverlay() {
  const { hasVault } = useVault();

  if (hasVault === false) {
    return <VaultSetupView />;
  }

  return <VaultUnlockView />;
}


