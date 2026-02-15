import PrimeVue from "primevue/config";
import MyPreset from "./primeVuePreset";

import Button from "primevue/button";
import Menu from "primevue/menu";
import Toast from "primevue/toast";

import ConfirmationService from "primevue/confirmationservice";
import ToastService from "primevue/toastservice";

export default {
  install(app: any) {
    app.use(PrimeVue, {
      theme: {
        preset: MyPreset,
        options: {
          prefix: "p",
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      ripple: true,
    });

    app.use(ToastService);
    app.use(ConfirmationService);

    app.component("Button", Button);
    app.component("Menu", Menu);
    app.component("Toast", Toast);
  },
};
