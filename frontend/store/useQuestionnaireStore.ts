import { create } from "zustand";

type QuestionnaireData = {
  ageRange: string;
  knowledge: string;
  income: string;
  goal: string;
};

type QuestionnaireStore = {
  data: QuestionnaireData;
  setAgeRange: (value: string) => void;
  setKnowledge: (value: string) => void;
  setIncome: (value: string) => void;
  setGoal: (value: string) => void;
  reset: () => void;
};

export const useQuestionnaireStore = create<QuestionnaireStore>((set) => ({
  data: {
    ageRange: "",
    knowledge: "",
    income: "",
    goal: "",
  },
  setAgeRange: (value) =>
    set((state) => ({ data: { ...state.data, ageRange: value } })),
  setKnowledge: (value) =>
    set((state) => ({ data: { ...state.data, knowledge: value } })),
  setIncome: (value) =>
    set((state) => ({ data: { ...state.data, income: value } })),
  setGoal: (value) =>
    set((state) => ({ data: { ...state.data, goal: value } })),
  reset: () =>
    set({
      data: { ageRange: "", knowledge: "", income: "", goal: "" },
    }),
}));

type UserState = {
  name: string;
  email: string;
  password: string;
  age: string;
  financeLevel: string;
  income: string;
  setUser: (data: Partial<UserState>) => void;
};

export const useUserStore = create<UserState>((set) => ({
  name: "",
  email: "",
  password: "",
  age: "",
  financeLevel: "",
  income: "",
  setUser: (data) => set((state) => ({ ...state, ...data })),
}));
