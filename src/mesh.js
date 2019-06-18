
import {
    BufferAttribute,
    BufferGeometry,
    DataTexture,
    Matrix4,
    Mesh,
    ShaderMaterial,
} from './lib/three.module';

const dummyTexture = new DataTexture(new Uint8Array([255, 0, 0, 0]), 1, 1);
dummyTexture.needsUpdate = true;

export class Entity {
    constructor(vertices, faces, normals, color) {
        this.color = color;

        const numFaces = faces.length;
        const numVertices = numFaces * 3;

        const vbuffer = new Float32Array(numVertices * 3);
        const nbuffer = new Float32Array(numVertices * 3);

        for (let i = 0; i < numFaces; i++) {
            const A = faces[i][0];
            const B = faces[i][1];
            const C = faces[i][2];

            vbuffer[(i * 9) + 0] = vertices[(A * 3) + 0];
            vbuffer[(i * 9) + 1] = vertices[(A * 3) + 1];
            vbuffer[(i * 9) + 2] = vertices[(A * 3) + 2];

            vbuffer[(i * 9) + 3] = vertices[(B * 3) + 0];
            vbuffer[(i * 9) + 4] = vertices[(B * 3) + 1];
            vbuffer[(i * 9) + 5] = vertices[(B * 3) + 2];

            vbuffer[(i * 9) + 6] = vertices[(C * 3) + 0];
            vbuffer[(i * 9) + 7] = vertices[(C * 3) + 1];
            vbuffer[(i * 9) + 8] = vertices[(C * 3) + 2];

            nbuffer[(i * 9) + 0] = normals[(A * 3) + 0];
            nbuffer[(i * 9) + 1] = normals[(A * 3) + 1];
            nbuffer[(i * 9) + 2] = normals[(A * 3) + 2];

            nbuffer[(i * 9) + 3] = normals[(B * 3) + 0];
            nbuffer[(i * 9) + 4] = normals[(B * 3) + 1];
            nbuffer[(i * 9) + 5] = normals[(B * 3) + 2];

            nbuffer[(i * 9) + 6] = normals[(C * 3) + 0];
            nbuffer[(i * 9) + 7] = normals[(C * 3) + 1];
            nbuffer[(i * 9) + 8] = normals[(C * 3) + 2];
        }

        const geom = new BufferGeometry();
        geom.addAttribute('position', new BufferAttribute(vbuffer, 3));
        geom.addAttribute('normal', new BufferAttribute(nbuffer, 3));

        geom.computeBoundingBox();

        this.createMaterial();
        this.mesh = new Mesh(geom, this.material);

        this.createShadowMaterial();
    }

    createMaterial() {
        this.material = new ShaderMaterial({
            uniforms: {
                color: { type: 'v3', value: this.color },
                lightsource: { type: 'v3', value: [0, 1, 1] },
                shadowmap: { type: 's', value: dummyTexture },
                depthBiasVP: { type: 'm4', value: new Matrix4() },
            },
            vertexShader: `
                uniform mat4 depthBiasVP;

                varying vec3 vNormal;

                varying vec3 shadowcoord;

                void main() {
                    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);

                    vec4 dp = (depthBiasVP * modelMatrix * vec4(position, 1.0));
                    shadowcoord = (vec3(dp.x, dp.y, dp.z / dp.w) + vec3(1.0)) * 0.5;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 lightsource;
                uniform vec3 color;

                uniform sampler2D shadowmap;

                varying vec3 vNormal;
                varying vec3 shadowcoord;

                const float shadowTolerance = 1e-3;

                void main() {
                    vec3 N = normalize(vNormal);
                    vec3 L = normalize(lightsource);

                    float d = max(0.0, dot(N, L));

                    float a = 0.2;

                    gl_FragColor = vec4((a + d) * color, 1.0);

                    float bias = shadowTolerance * tan(acos(dot(N, L)));
                    bias = clamp(bias, 0.0, 0.01);

                    // TODO: Blend shadows for softer look
                    if (texture2D(shadowmap, shadowcoord.xy).r < shadowcoord.z - bias) {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                    }
                }
            `,
        });
    }

    createShadowMaterial() {
        this.shadowMaterial = new ShaderMaterial({
            uniforms: {
            },
            vertexShader: `
                varying float depth;
                void main() {
                    depth = (projectionMatrix * modelViewMatrix * vec4(position, 1.0)).z;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying float depth;
                void main() {
                    gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
                }
            `,
        });

        this.shadowMaterial.extensions.fragDepth = true;
    }

    setScale(s) {
        this.mesh.scale.set(s, s, s);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}
