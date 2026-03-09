import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import * as THREE from "three";
import slide1 from "@/assets/slide-1.jpg";
import slide2 from "@/assets/slide-2.jpg";
import slide3 from "@/assets/slide-3.jpg";
import slide4 from "@/assets/slide-4.jpg";

const slideSources = [slide1, slide2, slide3, slide4];

type CarouselTextureContextValue = {
  textures: THREE.Texture[] | null;
};

const CarouselTextureContext = createContext<CarouselTextureContextValue>({ textures: null });

export function CarouselTextureProvider({ children }: { children: ReactNode }) {
  const [textures, setTextures] = useState<THREE.Texture[] | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    Promise.all(slideSources.map((src) => loader.loadAsync(src))).then(setTextures);
  }, []);

  return (
    <CarouselTextureContext.Provider value={{ textures }}>
      {children}
    </CarouselTextureContext.Provider>
  );
}

export function useCarouselTextures() {
  return useContext(CarouselTextureContext).textures;
}
