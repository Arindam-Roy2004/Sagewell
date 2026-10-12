import CreditsDialog from './CreditsDialog';
import CreditsExhaustedDialog from './CreditsExhaustedDialog';

/** Mounts both credit dialogs once for the whole workspace. */
export default function CreditsHost() {
  return (
    <>
      <CreditsDialog />
      <CreditsExhaustedDialog />
    </>
  );
}
