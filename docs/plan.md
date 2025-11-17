

MANUAL DETALLADO – PICTOFORGE ROUND-TRIP INTERFACE

Versión 0.1 – Borrador estructurado para expansión

Te lo entrego por secciones; cada sección funciona como una “página”.
Cuando quieras, seguimos ampliando.

⸻

SECCIÓN 1 – Visión General de PictoForge en el Ecosistema MediaFranca

1.1. Rol de PictoForge

PictoForge es el editor visual y semántico dentro del ecosistema MediaFranca.
Su función es doble:
	•	Editar visualmente los SVG generados por PictoNet.
	•	Editar semánticamente la estructura que gobierna el pictograma (NLU Schema).

El sistema es round-trip:
	•	Cada cambio visual debe reflejarse en el árbol semántico.
	•	Cada cambio semántico debe actualizar el SVG.
	•	Cada regeneración del modelo debe respetar los cambios manuales del usuario.

1.2. Objetivo del Editor
	•	Permitir al usuario ajustar pictogramas a nivel de bloques, a nivel de nodos, o a nivel de figura humana/objeto.
	•	Mantener el vínculo entre:
	•	La frase original.
	•	Su desglose semántico.
	•	La representación visual vectorial.

⸻

SECCIÓN 2 – Arquitectura General a Alto Nivel

2.1. Componentes principales
	1.	Input Layer
	•	Texto → NLU Schema
	•	SVG → NLU Schema (si se importa)
	•	Imagen → NLU Schema (futuro multimodal)
	2.	Semantic Layer
	•	Visualización del NLU-Schema.
	•	Edición de blends, roles, gestos, objetos, parámetros espaciales.
	3.	Visual Layer
	•	Edición SVG basada en nodos, grupos, y propiedades.
	•	Herramientas tipo Illustrator: selección negra, selección blanca, handles, anchors.
	4.	Model Layer
	•	Comunicación con PictoNet para:
	•	Regeneración total del pictograma.
	•	Regeneración de una parte específica.
	•	Sugerencias visuales para blends.
	5.	Storage Layer
	•	Base de datos local (permanente).
	•	Indexación del tesauro pictográfico.
	•	Versionamiento incremental.

⸻

SECCIÓN 3 – Input Layer (Texto, SVG, Imagen)

Aquí ya empezamos a entrar en detalle técnico.

3.1. Input de texto (actual)

El campo principal debe:
	•	Aceptar texto libre.
	•	Llamar al parser NLU (local o remoto).
	•	Ensamblar el nlu-schema.json correspondiente.

Ejemplo estructural:

{
  "utterance": "make the bed",
  "language": "en",
  "decomposition": {
    "verb": "make",
    "object": "bed",
    "agent": "human.default",
    "semantic_roles": {...},
    "visual_roles": {...}
  }
}

3.2. Botón “Importar SVG”

Características:
	•	Abrir archivo local.
	•	Parsear el SVG → convertir en una estructura interna editable.
	•	Generar un NLU Schema vacío pero anotado con:
	•	Objetos detectados.
	•	Grupos detectados.
	•	Notas de origen: "source": "imported-svg".

3.3. Input de imagen (futuro multimodal)

Debe integrarse como botón:

[ Import Image ]

Pipeline futuro:
	1.	Imagen → SAM / YOLO → segmentación.
	2.	Segmentos → etiquetas preliminares.
	3.	Modelo multimodal PictoNet-Vision → genera:
	•	Pictograma base
	•	Esquema NLU anotado.

⸻

SECCIÓN 4 – Árbol Semántico Editable (NLU Schema Panel)

Este panel es clave.

Debe permitir:
	•	Ver la frase desglosada como árbol.
	•	Editar parámetros:
	•	Persona/gesto.
	•	Objeto.
	•	Modificador.
	•	Espacialidad.
	•	Estilo.
	•	Reordenar nodos.
	•	Marcar nodos como “canónicos” o “en revisión”.
	•	Guardar notas para entrenamiento.

4.1. Formato del panel

Recomendado:
	•	Editor tipo JSON con validación (como JSONEditor).
	•	Vista dual:
	•	JSON plano.
	•	Vista tipo árbol interactivo estilo “inspector”.

4.2. Elementos visuales clave
	•	blends[]: Cada blend es una micro-acción visual.
	•	components[]: Entidades visuales.
	•	bindings[]: Relaciones entre componentes.

⸻

SECCIÓN 5 – Visual Editor Panel (SVG Node Editor)

5.1. Herramientas mínimas
	•	Selección negra: selecciona grupos.
	•	Selección blanca: nodos individuales.
	•	Handles para curvas (Bezier).
	•	Zoom / pan.
	•	Click + stylus events.

5.2. Soporte Apple Pencil

En iPadOS:
	•	pointerdown, pointermove, pointerup
	•	e.pressure
	•	e.tiltX, e.tiltY
	•	e.pointerType === "pen"

El motor de edición debe soportar:
	•	Variaciones con presión para boceto (modo dibujo).
	•	Conversión de trazos → paths → nodos.
	•	Clasificación automática del trazo (¿es brazo? ¿es mano?).

⸻

SECCIÓN 6 – Round-Trip Synchronisation

Aquí viene lo fino.

6.1. Edición semántica → actualiza SVG

Cuando el usuario:
	•	Cambia el gesto
	•	Cambia el objeto
	•	Cambia la espacialidad
	•	Cambia el tamaño relativo

El SVG se actualiza mediante:
	1.	Composición visual basada en blends.
	2.	Llamado parcial al modelo (si se desea).
	3.	Aplicación de transformaciones locales.

6.2. Edición SVG → actualiza semántica

Cuando:
	•	Se mueve un brazo.
	•	Se cambia la postura.
	•	Se reemplaza la figura humana.
	•	Se redibuja un objeto.

El sistema debe:
	1.	Detectar el nodo modificado.
	2.	Inferir su rol semántico (mediante mapping persistente).
	3.	Actualizar el nlu-schema:
	•	"pose": "new_pose_xyz"
	•	"object": "custom_drawn"
	•	"modifiers": [...]

⸻

SECCIÓN 7 – Regeneración Parcial con PictoNet

Este es uno de los pilares del diseño.

7.1. Cambio semántico parcial

Ejemplo:

“make the bed” → cambiar solo el gesto de la figura humana.

Pipeline:
	1.	Identificar el blend afectado.
	2.	Enviar solo ese blend al modelo:

{
  "task": "regenerate-blend",
  "blend_id": "agent.action",
  "utterance": "make the bed",
  "constraints": {...}
}

	3.	Recibir un nuevo SVG parcial.
	4.	Insertarlo en el SVG global sin mover los otros elementos.

7.2. Redibujo manual del usuario

Si el usuario redibuja completamente:
	•	El sistema clasifica el nuevo objeto.
	•	Actualiza el NLU schema:
"manual_override": true
	•	Marca el blend como “editable por usuario”.

7.3. Flujo RLHF (500 ejemplos)

Cada cambio validado:
	1.	Se guardan:
	•	SVG final
	•	SVG inicial
	•	nlu-schema
	•	“nota del evaluador”
	2.	Se incorporan en dataset incremental.
	3.	Modelo se reentrena por lotes.

⸻

SECCIÓN 8 – Base de Datos Local

8.1. Opciones
	•	SQLite + Prisma (ideal para embedded apps)
	•	IndexedDB (si solo Web)
	•	NeDB (si se usa Electron)

8.2. Estructura mínima

Tabla: pictograms

id
utterance
language
canonical (bool)
svg
nlu_schema (json)
created_at
updated_at
usage_count
tags

Tabla: tesauro

lemma
svg_reference
similarity_links[]
ratings[]
notes

Tabla: blends

id
type (agent, object, modifier...)
svg_fragment
nlu_fragment


⸻

SECCIÓN 9 – Tesauro Pictográfico y Espacio Semántico

Aquí describes tu “topología” de pictogramas.

Debe basarse en:
	•	Similitud visual.
	•	Similitud semántica.
	•	Frecuencia de uso.
	•	Aprobación comunitaria.
	•	Canonicalidad.

Representación recomendada: grafo.

Nodos = pictogramas
Aristas = relaciones:
	•	“misma acción”
	•	“misma postura”
	•	“misma categoría semántica”
	•	“variación cultural”
	•	“versión manual del usuario”
	•	“versión generada por modelo”

⸻

SECCIÓN 10 – Identidad del Usuario y Gobernanza Descentralizada

(Parte de tu reflexión anterior.)

El sistema debe incluir:
	•	Identidad local autocontenida (no Google, no Apple).
	•	Opción de SSI (Self-Sovereign Identity).
	•	Firmas locales de contribuciones.
	•	Registro de autoría en metadatos SVG:

<metadata>
  <dc:creator>did:herbert:xyz</dc:creator>
</metadata>



⸻

SECCIÓN 11 — Flujos de Usuario (User Flows) en PictoForge

Esta sección describe los flujos operativos que estructuran la interacción entre el usuario, el editor visual, el editor semántico y el modelo generativo PictoNet. Su propósito es ofrecer un marco detallado que permita al equipo de desarrollo implementar una arquitectura coherente, predecible y extensible.

Cada flujo se desglosa en pasos explícitos. Se incluye además la relación entre eventos, datos manipulados y puntos de sincronización round-trip.

⸻

11.1. Flujo A — Crear un pictograma desde texto

Objetivo

Transformar una frase en un pictograma editable, obteniendo simultáneamente su estructura NLU y el SVG correspondiente.

Pasos
	1.	El usuario introduce la frase en el campo de texto
	•	Evento: onSubmit(utterance)
	•	Datos enviados:

{ "utterance": "make the bed", "language": "en" }


	2.	El sistema invoca el parser NLU local o remoto
	•	Resultado: un objeto conforme al repositorio nlu-schema.
	3.	Render del árbol semántico en el panel izquierdo
	•	Vista dual: JSON + árbol interactivo.
	•	Validación sintáctica en tiempo real.
	4.	Invocación del modelo PictoNet
	•	Entrada: el NLU schema completo.
	•	Salida: un SVG estructurado con blends[] y components[].
	5.	Montaje del SVG en el editor visual
	•	El motor SVG asigna IDs únicos a grupos, nodos y blends.
	•	Se registra la correspondencia semántica:
blend_id → svg_group_id → semantic_role.
	6.	Persistencia local preliminar
	•	Se guarda una versión inicial en la base de datos local.
	•	Marca: "status": "generated".

⸻

11.2. Flujo B — Edición semántica → actualización visual

Objetivo

Permitir que cualquier cambio en el árbol semántico modifique el SVG sin romper edición previa.

Pasos
	1.	El usuario selecciona un nodo semántico (ej. agent.action)
	2.	El usuario modifica un valor (ej. postura, categoría, tamaño relativo).
	3.	El sistema marca ese nodo con pending_sync: true.
	4.	El motor semántico genera una actualización local del SVG
	•	Cambios paramétricos simples → transformación directa (sin modelo).
	•	Cambios complejos (postura humana, interacción física) → envío parcial al modelo.
	5.	Se actualiza únicamente el svg_group asociado al nodo editado.
	6.	Se registra un snapshot incremental en base de datos.

⸻

11.3. Flujo C — Edición visual → actualización semántica

Objetivo

Asegurar la coherencia round-trip cuando el usuario altera nodos del SVG.

Pasos
	1.	El usuario selecciona un nodo o grupo mediante:
	•	flecha negra (grupos),
	•	flecha blanca (nodos),
	•	stylus (puntos de dibujo).
	2.	El usuario modifica la geometría
	•	Traslación
	•	Rotación
	•	Edición de nodos
	•	Redibujo de figuras humanas u objetos
	3.	El motor SVG identifica el semantic_role vinculado al nodo
	•	Ej. agent.arm.right.forearm.
	4.	El sistema actualiza el NLU schema
	•	Campos ajustados:
	•	pose
	•	geometry
	•	manual_override: true
	•	blend_variant: "custom"
	5.	El sistema registra esta transformación como preferencia canónica local
	•	Se incrementa usage_count.
	•	Se añade una nota para la futura fase RLHF.

⸻

11.4. Flujo D — Regeneración parcial con PictoNet

Objetivo

Regenerar solo una parte del pictograma.

Pasos
	1.	El usuario selecciona un nodo semántico o un bloque visual.
	2.	Se presiona el botón: Regenerate this part.
	3.	El sistema crea un mensaje para PictoNet:

{
  "task": "regenerate-blend",
  "blend_id": "agent.gesture",
  "utterance": "make the bed",
  "constraints": { "preserve_layout": true }
}


	4.	El modelo devuelve un SVG parcial.
	5.	El motor de composición reemplaza solo ese grupo.
	6.	El NLU schema se actualiza en concordancia con la nueva salida.

⸻

11.5. Flujo E — Dibujar manualmente una figura u objeto

Objetivo

Permitir edición total mediante stylus (Apple Pencil, Android pen).

Pasos
	1.	El usuario activa Modo dibujo.
	2.	Se captura el trazo con eventos pointerType="pen".
	3.	El trazador convierte la polilínea → path SVG.
	4.	El sistema clasifica el path mediante heurísticas o modelo local:
	•	¿brazo?
	•	¿pierna?
	•	¿objeto?
	•	¿gesto?
	5.	El usuario asigna explícitamente el rol semántico si es necesario.
	6.	El NLU schema actualiza:

{
  "manual_override": true,
  "custom_shape": "path_id",
  "canonical_candidate": false
}


	7.	El objeto queda marcado como candidato para RLHF.

⸻

11.6. Flujo F — Guardar, versionar y recuperar

Objetivo

Mantener trazabilidad completa del trabajo.

Pasos
	1.	PictoForge guarda automáticamente cada acción relevante.
	2.	Cada versión incluye:
	•	SVG
	•	NLU Schema
	•	Hash del usuario/identidad local
	•	Timestamp
	•	Tags: "canonical" | "draft" | "manual"
	3.	El usuario puede:
	•	abrir versiones anteriores,
	•	comparar diffs semánticos,
	•	comparar diffs visuales,
	•	duplicar variantes.

⸻

11.7. Flujo G — Envío al dataset RLHF

Objetivo

Construir el corpus de ~500 ejemplos de alta calidad.

Pasos
	1.	El usuario pulsa “Marcar como bueno para dataset”.
	2.	El sistema realiza validaciones:
	•	Semántica completa
	•	Estructura SVG consistente
	•	Sin nodos sueltos
	•	Sin curvas desconectadas
	3.	Se archiva en datasets/local/approved/.
	4.	Cuando el usuario sincroniza, se envía un paquete:

{
  "dataset_batch": [
    {
      "utterance": "...",
      "nlu_schema": {...},
      "svg": "...",
      "notes": "approved_by_user"
    }
  ]
}


	5.	PictoNet-Trainer procesa el batch.

⸻

SECCIÓN 12 — Diagramas de Arquitectura y Modelos de Espacio Compartido

Esta sección describe la arquitectura general de PictoForge dentro del ecosistema MediaFranca, incluyendo el modo en que los espacios semánticos, los tesauros y los conjuntos de pictogramas se comparten entre usuarios, equipos y organizaciones sin depender de un servidor central. El propósito es definir con claridad los mecanismos de interoperabilidad, sincronización, versionado y convergencia.

La sección se divide en tres módulos:
	1.	12.1. Arquitectura interna de PictoForge
	2.	12.2. Arquitectura federada entre instancias locales
	3.	12.3. Mecanismos para compartir, fusionar y propagar espacios lingüísticos y pictográficos

⸻

12.1. Arquitectura Interna de PictoForge (Diagrama de Capas)

La arquitectura puede representarse como un sistema multicapa con responsabilidades separadas. A nivel conceptual:

┌──────────────────────────────────────────────┐
│                Capa de Interfaz              │
│   - Editor Semántico (NLU Schema Panel)      │
│   - Editor Visual (SVG Node Editor)          │
│   - Módulo de Entrada (Texto/SVG/Imagen)     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│             Capa de Sincronización           │
│   - Gestor Round-Trip Semántico ↔ Visual     │
│   - Sistema de Versionado Local              │
│   - Registro de Cambios                      │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│               Capa del Modelo                │
│   - Generación completa (PictoNet)           │
│   - Regeneración parcial (blends)            │
│   - Ajuste por retroalimentación             │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│           Capa de Almacenamiento             │
│   - Base de datos local (pictogramas)        │
│   - Tesauro local                            │
│   - Metadatos semánticos                     │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│         Capa de Identidad y Autenticación    │
│   - Identidad autosoberana (SSI opcional)    │
│   - Firmas locales de contribuciones         │
└──────────────────────────────────────────────┘


⸻

12.2. Arquitectura Federada entre Instancias Locales

En MediaFranca no existe un servidor central que actúe como fuente única de verdad. El sistema se concibe como una federación de nodos locales, donde cada instalación de PictoForge contiene:
	•	su base de datos local,
	•	su tesauro,
	•	sus métricas de frecuencia,
	•	su historial de versiones,
	•	sus evaluaciones propias.

Para compartir datos, se utilizan intercambios explícitos, no sincronización automática global. Esto permite que cada institución mantenga su autonomía lingüística y visual.

Modelo general de federación

┌─────────────────────────┐         ┌──────────────────────────┐
│ PictoForge — Nodo A     │         │ PictoForge — Nodo B      │
│ BD Local A              │  <–––>   │ BD Local B               │
│ Tesauro A               │          │ Tesauro B                │
│ Identidad A             │          │ Identidad B              │
└─────────────────────────┘         └──────────────────────────┘
             ↘                                    ↙
                 ┌────────────────────────┐
                 │   PictoNet Trainer     │
                 │   (Servidor opcional)  │
                 └────────────────────────┘

Observación técnica

El servidor de entrenamiento es opcional y no centraliza la comunicación ni almacena identidades. Solo recibe:
	•	batches de datos aprobados,
	•	versiones consolidadas del tesauro,
	•	estructuras semánticas anotadas,
	•	metadatos de entrenamiento.

No conserva identidad del usuario.
No conserva SVG personales sin consentimiento explícito.

⸻

12.3. Mecanismos de Espacio Compartido del Lenguaje

Esta es la parte clave que pediste:
cómo se comparten los espacios semánticos, cómo convergen y cómo mantienen coherencia sin centralización.

12.3.1. El espacio compartido no es un objeto, es una relación

En MediaFranca, un “espacio compartido del lenguaje” no es un archivo único. Se construye mediante:
	•	intersecciones entre tesauros,
	•	variantes lingüísticas reconocidas,
	•	compatibilidad entre estructuras NLU,
	•	vectores de similitud entre pictogramas,
	•	historial de elecciones de usuarios.

En otras palabras:
se comparte una estructura relacional, no un diccionario monolítico.

12.3.2. Sincronización por paquetes (exchange bundles)

Cada nodo puede exportar un paquete estructurado que contiene:

exchange_bundle:
  version: 1.0
  pictograms:
    - id
    - svg
    - nlu_schema
    - status (canonical, experimental)
  thesaurus:
    - lemma
    - relations[]
  metadata:
    - creator
    - timestamp
    - domain

Estos paquetes se pueden:
	•	enviar por correo,
	•	compartir por carpeta,
	•	sincronizar por servidor simple,
	•	publicar en repositorios comunitarios.

12.3.3. Mecanismo de fusión (merge)

Cuando un nodo recibe un paquete:
	1.	Se realiza un análisis de conflictos:
	•	pictogramas duplicados con diferencias;
	•	equivalencias semánticas con variación gráfica;
	•	blends incompatibles.
	2.	Se crean resoluciones explícitas:
	•	elegir una versión canónica local;
	•	mantener ambas como variantes culturales;
	•	marcar una como “derivada de”.
	3.	El resultado se registra en el tesauro local.

El sistema no sobreescribe automáticamente nada.
La convergencia es gradual y guiada por decisiones humanas.

12.3.4. Dimensión de comunidad lingüística

La identidad de comunidad se expresa mediante metadatos:
	•	región,
	•	institución,
	•	estilo gráfico,
	•	características culturales,
	•	variaciones preferidas.

Los pictogramas y estructuras lingüísticas se pueden etiquetar como:

"domain": "Chile",
"domain": "Aotearoa",
"domain": "Hospital",
"domain": "Educación Especial",

Estas etiquetas permiten que el sistema:
	•	filtre pictogramas destinados a un contexto,
	•	genere variantes adaptadas,
	•	conserve coherencia estilística y cultural.

12.3.5. Indexación del espacio compartido

Cada nodo mantiene una matriz local de similitud:

sim(agent.pose, agent.pose') = valor
sim(object, object') = valor
sim(style, style') = valor

El espacio compartido emerge cuando las matrices locales se alinean mediante:
	•	intercambio de paquetes,
	•	consenso gradual,
	•	entrenamiento federado del modelo,
	•	retorno de resultados a los nodos.

La convergencia no se impone: se acuerda mediante uso repetido.
----
