# 🎮 Aventura de Multiplicación 3D

Un juego educativo interactivo para aprender las tablas de multiplicar con una aventura oceánica en 3D.

## ✨ Características

- **🎯 Aventura 3D**: Navega por islas mientras resuelves multiplicaciones
- **🎮 Interfaz Intuitiva**: Calculadora virtual integrada
- **⏰ Sistema de Tiempo**: Diferentes niveles de dificultad
- **🦈 Elementos de Juego**: Tiburones, peces y animaciones dinámicas
- **🔊 Efectos de Sonido**: Audio para respuestas correctas e incorrectas
- **📱 Responsive**: Compatible con dispositivos móviles

## 🏗️ Estructura del Proyecto

```
Tablas-de-multiplicar/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── script.js               # Script original (legacy)
├── js/                     # Módulos JavaScript organizados
│   ├── app.js             # Punto de entrada de la aplicación
│   ├── main.js            # Clase principal del juego
│   ├── constants.js       # Constantes y configuración
│   └── audio.js           # Sistema de audio
├── img/                   # Imágenes del juego
│   ├── child.svg          # Personaje principal
│   └── Captura de pantalla 2025-04-13 120001.png
└── sounds/                # Archivos de audio
    ├── correct.mp3        # Sonido de respuesta correcta
    └── wrong.mp3          # Sonido de respuesta incorrecta
```

## 🚀 Cómo Jugar

### Opción 1: Archivo Local (Recomendado para uso simple)
1. **Abre** `index.html` directamente en tu navegador
2. **Selecciona** el nivel de dificultad (Fácil/Medio/Difícil)
3. **Resuelve** las multiplicaciones usando el teclado o la calculadora virtual
4. **Navega** por las islas completando las tablas de multiplicar
5. **¡Cuidado con los tiburones!** Te atacarán si respondes incorrectamente

### Opción 2: Servidor Local (Para desarrollo)
1. **Ejecuta** `iniciar-servidor.bat` (Windows) o `python server.py`
2. **Abre** http://localhost:8000 en tu navegador
3. **Usa** `index-modular.html` para la versión modular con ES6

## 🎯 Mecánicas del Juego

- **10 Islas**: Una para cada tabla de multiplicar (1-10)
- **5 Preguntas por Isla**: Debes responder correctamente para avanzar
- **Sistema de Puntuación**: 10 puntos por respuesta correcta
- **Temporizador**: Tiempo limitado según la dificultad
- **Ataques de Tiburón**: 3 errores antes de perder

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura de la página
- **CSS3**: Estilos y animaciones
- **JavaScript ES6+**: Lógica del juego con módulos
- **Three.js**: Gráficos 3D y animaciones
- **Web Audio API**: Sistema de sonido

## 📝 Desarrollo

### Estructura Modular

El juego está organizado en módulos ES6 para mejor mantenibilidad:

- **`constants.js`**: Configuración centralizada
- **`audio.js`**: Gestión de sonidos
- **`main.js`**: Lógica principal del juego
- **`app.js`**: Inicialización de la aplicación

### Mejoras Implementadas

1. ✅ **Imagen del personaje**: Creada como SVG escalable
2. ✅ **Estructura modular**: Código organizado en módulos
3. ✅ **Sistema de audio**: Gestión centralizada de sonidos
4. ✅ **Constantes centralizadas**: Fácil configuración
5. ✅ **Documentación**: README actualizado

## 🔧 Personalización

Puedes modificar fácilmente:

- **Dificultades**: En `js/constants.js`
- **Colores**: Variables CSS en `styles.css`
- **Sonidos**: Reemplaza archivos en `sounds/`
- **Personaje**: Modifica `img/child.svg`

## 🌐 Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## 🔧 Solución de Problemas

### Error: "Solicitud desde otro origen bloqueada"
**Problema**: CORS al abrir `index.html` directamente
**Solución**: Usa el servidor local:
```bash
python server.py
# O ejecuta iniciar-servidor.bat en Windows
```

### Error: "Módulo no encontrado"
**Problema**: Los módulos ES6 no funcionan con `file://`
**Solución**: Usa `index.html` (versión compatible) en lugar de `index-modular.html`

### No se escuchan los sonidos
**Problema**: Los archivos de audio no se cargan
**Solución**: Verifica que existan los archivos en `sounds/` y usa el servidor local

### La imagen del personaje no aparece
**Problema**: `child.png` no existe
**Solución**: El juego ahora usa `child.svg` - verifica que exista en `img/`

## 📱 Responsive Design

El juego se adapta automáticamente a diferentes tamaños de pantalla:
- **Desktop**: Interfaz completa con controles 3D
- **Tablet**: Interfaz optimizada para touch
- **Mobile**: Teclado virtual simplificado

---

¡Disfruta aprendiendo las tablas de multiplicar de forma divertida! 🎓✨
