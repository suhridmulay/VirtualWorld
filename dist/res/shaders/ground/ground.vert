varying vec3 vPosition;
varying vec3 vNormal;

varying vec2 vUV;

void main() {
    vPosition = position;
    vNormal = normal;
    vUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}