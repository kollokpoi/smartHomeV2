<template>
    <div class="not-found">
      <h1>404 - Страница не найдена</h1>
      <p>Запрошенная страница не существует</p>
      <router-link to="/" class="btn">
        Вернуться на главную
      </router-link>
    </div>
  </template>
  
  <script setup lang="ts">
  </script>
  
  <style scoped>
  .not-found {
    text-align: center;
    padding: 4rem 2rem;
  }
  
  .btn {
    display: inline-block;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #42b883;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }
  </style>