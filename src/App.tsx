import { useEffect, useState } from 'react'
import Arcade from './mock/arcade'
import Gameboy from './mock/gameboy'
import Jrpg from './mock/jrpg'
import Pastel from './mock/pastel'
import Pixel from './mock/pixel'
import Sticker from './mock/sticker'

const variants = { pixel: Pixel, gameboy: Gameboy, jrpg: Jrpg, arcade: Arcade, pastel: Pastel, sticker: Sticker }
type Variant = keyof typeof variants

function fromHash(): Variant {
  const h = window.location.hash.slice(1)
  return Object.hasOwn(variants, h) ? (h as Variant) : 'pixel'
}

export default function App() {
  const [variant, setVariant] = useState<Variant>(fromHash)

  useEffect(() => {
    const onHash = () => setVariant(fromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const Screen = variants[variant]
  return (
    <>
      <nav className="switcher">
        {Object.keys(variants).map((v) => (
          <a key={v} href={`#${v}`} aria-current={v === variant ? 'page' : undefined}>
            {v}
          </a>
        ))}
      </nav>
      <div className="phone">
        <Screen key={variant} />
      </div>
    </>
  )
}
