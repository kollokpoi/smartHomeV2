<template>
    <div class="w-full h-screen flex justify-center items-center bg-back-primary">
        <div class="flex flex-col bg-back-accent rounded-xl w-full md:w-120 mx-3 p-5 gap-4 items-center">
            <h2 class="text-font-primary text-2xl font-bold">Авторизация</h2>
            <div class="w-full">
                <label for="login" class="text-font-primary">Логин</label>
                <InputText id="login" type="email" v-model="email" class="w-full" placeholder="Логин" />
            </div>
            <div class="w-full">
                <label for="password" class="text-font-primary">Пароль</label>
                <InputText id="password" type="password" v-model="password" class="w-full" placeholder="Пароль" />
            </div>
            <Button severity="secondary" class="text-font-oposit w-1/2" @click="authorize">Войти</Button>
        </div>
    </div>
    <Toast />
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/modules/auth.store';
import { useToast } from 'primevue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const authStore = useAuthStore();
const toast = useToast()
const router = useRouter()

const email = ref<string | undefined>()
const password = ref<string | undefined>()

const authorize = async () => {
    if (!email.value || !password.value) {
        toast.add({
            summary: "Нет данных",
            detail: "Укажите данные во все поля",
            severity: 'warn',
            life: 3000
        })
        return
    }

    try {
        const response = await authStore.login({ email: email.value, password: password.value })
        if (response.success) {
            router.push('/')
        } else {
            toast.add({
                summary: "Ошибка авторизации",
                detail: response.error ||"Неизвестная ошибка",
                severity: 'warn',
                life: 3000
            })
        }
    } catch (e: any) {
        toast.add({
            summary: "Ошибка авторизации",
            detail: e.message ||"Неизвестная ошибка",
            severity: 'warn',
            life: 3000
        })
    }

}
</script>