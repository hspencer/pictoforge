# Instrucciones para Probar la Edición de Nodos

## Estado Actual
He agregado logs de debug para investigar por qué el drag de nodos no funciona:
- `🎯 handleNodeDrag iniciado` - Se dispara cuando haces mousedown en un nodo
- `📝 Registrando listeners` - Confirma que los event listeners se registraron
- `✅ handleNodeDrag finalizado` - Se dispara cuando sueltas el mouse

## Pasos para Probar

### 1. Cargar un SVG con Path
- En http://localhost:5173/
- Cargar cualquier SVG que tenga elementos `<path>`

### 2. Seleccionar con Flecha Blanca (Node Tool)
- Click en el botón de la **flecha blanca** (flecha fina, tool='node')
- Click en un elemento PATH
- **Esperado**: Deberían aparecer nodos (círculos blancos con borde azul)

### 3. Intentar Arrastrar un Nodo
- Con la flecha blanca activa
- Click y mantén presionado sobre un nodo (círculo blanco)
- Arrastra el mouse
- **Esperado**: El nodo debe moverse siguiendo el mouse

### 4. Revisar la Consola del Navegador
Abre DevTools (F12) y busca estos logs:

**Al hacer click en un nodo:**
```
🎯 handleNodeDrag iniciado { tool: 'node', nodeIndex: 2 }
📝 Registrando listeners de mousemove y mouseup
```

**Al soltar el mouse:**
```
✅ handleNodeDrag finalizado
```

## Problemas Posibles

### Si NO ves los logs "🎯 handleNodeDrag iniciado":
**Causa**: El evento `onMouseDown` no se está disparando
**Razones posibles**:
1. Los nodos no se están renderizando (verificar en inspector si existen los `<circle>`)
2. Hay un elemento encima bloqueando los eventos (verificar z-index)
3. `pointerEvents: 'all'` no está funcionando

### Si ves "🎯" pero el nodo NO se mueve:
**Causa**: Los listeners de `mousemove` no se disparan o `onNodeChange` no actualiza
**Verificar**:
1. ¿Se llama `onNodeChange`? (agregar log temporal)
2. ¿`screenToSVG` está definido y funciona?
3. ¿`rawNodes[node.index]` existe?

### Si el nodo "salta" al clickear:
**Causa**: Coordenadas mal transformadas
**Solución**: Ya agregué `e.preventDefault()` para evitar esto

## Próximos Pasos Según Resultados

**Escenario A**: Los logs aparecen pero el nodo no se mueve
→ Problema en `onNodeChange` o `updateNodeInPath`

**Escenario B**: Los logs NO aparecen
→ Problema en el rendering o event binding de los círculos

**Escenario C**: Todo funciona
→ ¡Perfecto! Remover logs y documentar

## Permitir Selección Directa con Flecha Blanca

Actualmente requiere:
1. Seleccionar con flecha gruesa (select)
2. Cambiar a flecha fina (node)

**Código actual** (líneas 601-640 en SVGViewer.jsx):
La herramienta 'node' YA permite seleccionar elementos directamente.

**Probar**:
1. Click en flecha blanca
2. Click DIRECTAMENTE en un path (sin usar flecha gruesa primero)
3. ¿Aparecen los nodos?

Si NO aparecen, el problema está en que `onElementSelect` no se está llamando o `selectedElement` no se propaga correctamente.
