import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Download, Eye } from "lucide-react";
import TopBar from "@/components/top-bar";

export default function Dictionary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Mock data - in real app this would come from database
  const pictograms = [
    {
      id: 1,
      name: "make-the-bed",
      prompt: "Person making a bed with pillows and sheets",
      svgCode: "<!-- SVG content -->",
      tags: ["daily-activities", "bedroom", "household"],
      instances: ["maori", "english"],
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "cook-dinner",
      prompt: "Person cooking dinner in kitchen",
      svgCode: "<!-- SVG content -->",
      tags: ["cooking", "kitchen", "food"],
      instances: ["maori"],
      createdAt: "2024-01-14"
    }
  ];

  const categories = ["daily-activities", "cooking", "bedroom", "household", "food", "kitchen"];

  const filteredPictograms = pictograms.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(tag => tag.includes(searchQuery.toLowerCase()))
  ).filter(p => 
    !selectedCategory || p.tags.includes(selectedCategory)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar 
        breadcrumbs={[
          { label: "PictoNet", href: "/" },
          { label: "Diccionario" }
        ]}
        subtitle="Pictogramas globales"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Diccionario Global de Pictogramas
          </h1>
          <p className="text-gray-600">
            Explora todos los pictogramas generados en la plataforma
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, prompt o etiqueta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todas las categorías
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPictograms.map((pictogram) => (
            <Card key={pictogram.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{pictogram.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SVG Preview */}
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-sm">Vista previa SVG</div>
                </div>

                {/* Prompt */}
                <div>
                  <p className="text-sm text-gray-600 italic">
                    "{pictogram.prompt}"
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {pictogram.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Instances */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Disponible en:</p>
                  <div className="flex gap-1">
                    {pictogram.instances.map((instance) => (
                      <Badge key={instance} variant="outline" className="text-xs">
                        {instance}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="w-3 h-3 mr-1" />
                    Descargar
                  </Button>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-400 pt-2 border-t">
                  Creado: {pictogram.createdAt}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filteredPictograms.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron pictogramas
            </h3>
            <p className="text-gray-500">
              Intenta con otros términos de búsqueda o categorías
            </p>
          </div>
        )}
      </div>
    </div>
  );
}