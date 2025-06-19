"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

type R2Image = {
  key: string
  uploaded: string
}

const imageLoader = ({ src }: { src: string }) => {
  return `/api/image?key=${src}`
}

export default function Images() {
  const [images, setImages] = useState<R2Image[]>([])

  useEffect(() => {
    const fetchImages = async () => {
      const currentUrl = new URL(window.location.href)
      const data = await fetch(`${currentUrl.origin}/api/images`)
      const imageData = await data.json<R2Image[]>()
      setImages(imageData)
      console.log(imageData)
    }

    fetchImages()
  }, [])

  return (
    <div className="min-h-screen block md:flex bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="w-full flex flex-col md:h-screen bg-white rounded-lg shadow-xl animate-slide-in-left overflow-hidden">
        <div className="p-4 space-y-2 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 animate-fade-in">图片列表</h1>
          <h2 className="text-md text-gray-600 mb-8">
            由{" "}
            <a href="https://developers.cloudflare.com/workers-ai" className="text-blue-500 hover:underline">
              Cloudflare Workers AI
            </a>{" "}
            提供支持。 源代码可在{" "}
            <a
              href="https://github.com/kristianfreeman/workers-ai-image-playground"
              className="text-blue-500 hover:underline"
            >
              GitHub
            </a>{" "}
            上获取。
          </h2>
        </div>

        <div className="p-4 flex flex-col gap-4 flex-grow overflow-auto">
          {!images || (!images.length && <span className="text-gray-500">暂无图片。</span>)}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-screen-lg mx-auto">
            {images.map((image) => (
              <div className="space-y-2 group cursor-pointer" key={image.key}>
                <Image
                  loader={imageLoader}
                  src={image.key || "/placeholder.svg"}
                  width={256}
                  height={256}
                  alt={image.key}
                  className="rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
                <p className="text-sm truncate text-gray-700 group-hover:text-blue-600 transition-colors">
                  {image.key}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4">
            <Button asChild>
              <Link href="/">返回图片生成器</Link>
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
