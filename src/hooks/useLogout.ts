import { useAuthStore } from "@/src/stores/authStore";
import { resetAllStores } from "@/src/stores/resetStore";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";

export const useLogout = () => {
  const authLogout = useAuthStore((state) => state.logout);
  const { dismissAll } = useBottomSheetModal();

  const logout = async () => {
    dismissAll();
    await authLogout();
    await resetAllStores();
  };

  return { logout };
};
