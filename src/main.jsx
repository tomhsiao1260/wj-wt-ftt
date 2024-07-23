import './style.css'
import * as THREE from 'three'
import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <StrictMode>
        <App />
    </StrictMode>
)
