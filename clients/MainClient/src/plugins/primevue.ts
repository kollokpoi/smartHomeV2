
import PrimeVue from 'primevue/config'
import MyPreset from './primeVuePreset'

import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Card from 'primevue/card'
import ColumnPrime from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import Timeline from 'primevue/timeline'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Toast from 'primevue/toast'
import Avatar from 'primevue/avatar'
import ConfirmDialog from 'primevue/confirmdialog'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Badge from 'primevue/badge'
import { AutoComplete } from 'primevue'

import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

export default {
  install(app: any) {
    app.use(PrimeVue, {
      theme: {
        preset: MyPreset,
        options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      ripple: true,
    })

    app.use(ToastService)
    app.use(ConfirmationService)

    app.component('AvatarPrime', Avatar)
    app.component('ButtonPrime', Button)
    app.component('ButtonGroup', ButtonGroup)
    app.component('CardPrime', Card)
    app.component('ColumnPrime', ColumnPrime)
    app.component('DataTable', DataTable)
    app.component('DatePicker', DatePicker)
    app.component('DialogPrime', Dialog)
    app.component('DividerPrime', Divider)
    app.component('InputNumber', InputNumber)
    app.component('InputText', InputText)
    app.component('ProgressBar', ProgressBar)
    app.component('TagPrime', Tag)
    app.component('TextareaPrime', Textarea)
    app.component('TimelinePrime', Timeline)
    app.component('ToastPrime', Toast)
    app.component('AutoComplete',AutoComplete)
    app.component('ConfirmDialog',ConfirmDialog)
    app.component('ProgressSpinner',ProgressSpinner)
    app.component('PaginatorPrime',Paginator)
    app.component('SelectPrime',Select)
    app.component('CheckboxPrime',Checkbox)
    app.component('BadgePrime',Badge)
  },
}
