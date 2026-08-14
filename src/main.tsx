import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/geist-sans/500.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'

// Order matters: tokens define the variables the rest reference.
import './styles/tokens.css'
import './styles/type.css'
import './styles/ios.css'
import './styles/board.css'
import './styles/global.css'

import { App } from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
