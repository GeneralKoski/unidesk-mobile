import { useCareerStore } from "./careerStore";
import { useTranslationStore } from "./translationStore";

export const resetAllStores = async () => {
  useCareerStore.getState().reset();
  useTranslationStore.getState().reset();
};
