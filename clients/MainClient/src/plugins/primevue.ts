import PrimeVue from "primevue/config";
import MyPreset from "./primeVuePreset";

import Button from "primevue/button";
import Menu from "primevue/menu";
import Toast from "primevue/toast";
import DataTable from "primevue/datatable"
import Column from "primevue/column";
import InputText from "primevue/inputtext"
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import Select from "primevue/select"
import InputNumber from "primevue/inputnumber";
import DatePicker from "primevue/datepicker";
import Paginator from "primevue/paginator"
import ProgressSpinner  from "primevue/progressspinner";
import Textarea from "primevue/textarea";
import Tag  from "primevue/tag";
import Badge  from "primevue/badge";

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
    app.component("Toast", Toast);
    app.component("DataTable", DataTable)
    app.component("Column", Column)
    app.component("ConfirmDialog", ConfirmDialog)
    app.component("Menu", Menu)
    app.component("InputText", InputText)
    app.component("Dialog", Dialog)
    app.component("Select", Select)
    app.component("InputNumber", InputNumber)
    app.component("DatePicker", DatePicker)
    app.component("Paginator",Paginator)
    app.component("ProgressSpinner",ProgressSpinner)
    app.component("Textarea",Textarea)
    app.component("Tag",Tag)
    app.component("Badge",Badge)
  },
};
