<template>
  <div class="flex flex-row items-center justify-between mb-4">
    <router-link to="/">
      <img src="../assets/logo_horizontal.png" width="150" class="cursor-pointer" />
    </router-link>
    
    <!-- Menú hamburguesa con iconos -->
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-ghost btn-circle">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </div>
      <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li v-permission="Permission.VIEW_DASHBOARD">
          <router-link to="/dashboard" class="text-black">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Dashboard
          </router-link>
        </li>
        <li v-permission="Permission.VIEW_REPORTS">
          <router-link to="/admin" class="text-black">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Reportes
          </router-link>
        </li>
        <li v-permission="Permission.CREATE_EVENTS">
          <router-link to="/events" class="text-black">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Eventos
          </router-link>
        </li>
        <li><hr class="my-1"></li>
        <li>
          <a @click="handleLogout" class="text-black">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase'
import { useRouter } from 'vue-router'
import { Permission } from '@/types.js'

const router = useRouter()

const handleLogout = async () => {
  try {
    await signOut(auth)
    console.log('Sesión cerrada con éxito')
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message)
  }
}
</script>