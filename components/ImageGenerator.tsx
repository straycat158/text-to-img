"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download } from "lucide-react"
import Link from "next/link"

type Model = {
  id: string
  name: string
}

type SchemaProperty = {
  type: string
  description: string
  default?: any
  minimum?: number
  maximum?: number
}

type Schema = {
  input: {
    properties: Record<string, SchemaProperty>
    required: string[]
  }
}

export default function SimpleImageGenerator() {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [schema, setSchema] = useState<Schema | null>(null)
  const [inputValues, setInputValues] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageVisible, setImageVisible] = useState(false) // New state for animation

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data as Model[]))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedModel) {
      fetch(`/api/schema?model=${selectedModel}`)
        .then((res) => res.json())
        .then((ns) => {
          const newSchema = ns as Schema
          setSchema(newSchema)
          const defaultValues = Object.entries(newSchema.input.properties).reduce(
            (acc, [key, prop]) => {
              if (prop.default !== undefined) acc[key] = prop.default
              return acc
            },
            {} as Record<string, any>,
          )
          setInputValues(defaultValues)
        })
        .catch(console.error)
    }
  }, [selectedModel])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)
      setGeneratedImage(null) // Clear previous image
      setImageVisible(false) // Hide image for new generation
      try {
        const response = await fetch("/api/generate_image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: selectedModel, ...inputValues }),
        })
        if (response.ok) {
          const imageUrl = await response.text()
          setGeneratedImage(imageUrl)
          // Trigger fade-in after image source is set
          setTimeout(() => setImageVisible(true), 50) // Small delay to ensure render
        } else {
          console.error("Error generating image:", response.statusText)
        }
      } catch (error) {
        console.error("Error generating image:", error)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedModel, inputValues],
  )

  const isFormValid = useCallback(() => {
    return (
      selectedModel &&
      schema?.input.required.every((field) => inputValues[field] !== undefined && inputValues[field] !== "")
    )
  }, [selectedModel, schema, inputValues])

  const handleDownload = useCallback(() => {
    if (generatedImage) {
      const link = document.createElement("a")
      link.href = generatedImage
      link.download = "generated-image.png"
      link.click()
    }
  }, [generatedImage])

  return (
    <div className="min-h-screen block md:flex bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="w-full md:w-1/2 flex flex-col md:h-screen bg-white rounded-lg shadow-xl animate-slide-in-left overflow-hidden">
        <div className="p-4 space-y-2 border-b border-gray-200">
          <h1 className="text-3xl font-extrabold text-gray-900 animate-fade-in">AI 绘画</h1>
          <h2 className="text-md text-gray-600">
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
            上获取。&nbsp;
            <Link className="underline text-blue-500 hover:text-blue-700" href="/images">
              查看所有生成的图片。
            </Link>
          </h2>
        </div>
        <div className="flex-grow overflow-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                AI 模型
              </label>
              <Select onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="选择一个 AI 模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map(({ id, name }) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {schema &&
              Object.entries(schema.input.properties).map(([key, value]) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)} {schema.input.required.includes(key) && "*"}
                  </label>
                  <Input
                    id={key}
                    type={value.type === "integer" || value.type === "number" ? "number" : "text"}
                    placeholder={value.description}
                    value={inputValues[key] || ""}
                    onChange={(e) => setInputValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    min={value.minimum}
                    max={value.maximum}
                    required={schema.input.required.includes(key)}
                  />
                </div>
              ))}
          </form>
        </div>
        <div className="p-4 bg-white border-t border-gray-200">
          <Button onClick={handleSubmit} disabled={isLoading || !isFormValid()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中...
              </>
            ) : (
              "生成图片"
            )}
          </Button>
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-xl animate-slide-in-right md:ml-4 mt-4 md:mt-0">
        {isLoading ? (
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        ) : generatedImage ? (
          <>
            <Image
              src={generatedImage || "/placeholder.svg"}
              alt="Generated"
              className={`w-full h-auto rounded-lg shadow-lg mb-4 transition-opacity duration-500 ${imageVisible ? "opacity-100" : "opacity-0"}`}
              width={512}
              height={512}
            />
            <Button onClick={handleDownload} className="mt-4">
              <Download className="mr-2 h-4 w-4" /> 下载图片
            </Button>
          </>
        ) : (
          <div className="text-center text-gray-500">您生成的图片将显示在此处</div>
        )}
      </div>
    </div>
  )
}
