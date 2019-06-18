
import {
    Euler,
    FloatType,
    Matrix4,
    NearestFilter,
    OrthographicCamera,
    PerspectiveCamera,
    RGBAFormat,
    Scene,
    Vector3,
    WebGLRenderer,
    WebGLRenderTarget,
} from './lib/three.module';

export class Renderer {
    constructor(width, height) {
        try {
            this.renderer = new WebGLRenderer({
                antialias: true,
                alpha: true,
            });
        } catch (e) {
            throw new Error('Could not initialize WebGL');
        }

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(width, height);
        this.renderer.context.getExtension('EXT_frag_depth_extension');

        this.width = width;
        this.height = height;

        this.entities = [];

        this.scene = new Scene();

        this.lightsource = [0, 1, 1];

        this.createCamera();
        this.createShadowmap();
    }

    createCamera() {
        const fov = 45;
        const aspect = this.width / this.height;

        this.camera = new PerspectiveCamera(fov, aspect, 0.01, 100.0);

        const pos = new Vector3(0, 0, -3);
        const rot = new Matrix4().makeRotationFromEuler(
            new Euler(30 * Math.PI / 180, 135 * Math.PI / 180, 0, 'ZYX'),
        );

        const newPos = pos.applyMatrix4(rot);

        this.camera.position.x = newPos.x;
        this.camera.position.y = newPos.y;
        this.camera.position.z = newPos.z;
        this.camera.lookAt(0, 0, 0);

        const R = 2;
        const T = 2;

        this.lightCamera = new OrthographicCamera(-R, R, T, -T, -1, 10);

        this.lightCamera.position.x = this.lightsource[0];
        this.lightCamera.position.y = this.lightsource[1];
        this.lightCamera.position.z = this.lightsource[2];
        this.lightCamera.lookAt(0, 0, 0);
    }

    createShadowmap() {
        this.shadowmap = new WebGLRenderTarget(2048, 2048, {
            magFilter: NearestFilter,
            minFilter: NearestFilter,
            format: RGBAFormat,
            type: FloatType,
        });
    }

    add(entity) {
        entity.mesh.material.uniforms.lightsource.value = [
            this.lightsource[0],
            this.lightsource[1],
            this.lightsource[2],
        ];

        this.entities.push(entity);
        this.scene.add(entity.mesh);
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.renderer.setSize(width, height);
    }

    setLight(x, y, z) {
        this.lightsource = [x, y, z];
        for (const entity of this.entities) {
            entity.mesh.material.uniforms.lightsource.value = [x, y, z];
        }
    }

    renderShadowmap() {
        const depthViewMatrix = this.lightCamera.matrixWorldInverse;
        const depthProjectionMatrix = this.lightCamera.projectionMatrix;

        for (const entity of this.entities) {
            entity.mesh.material = entity.shadowMaterial;
        }

        this.renderer.setClearColor(0xffffff, 1.0);

        this.renderer.render(this.scene, this.lightCamera, this.shadowmap);

        this.renderer.setClearColor(0x000000, 0.0);

        const depthMatrix = new Matrix4()
            .multiply(depthProjectionMatrix)
            .multiply(depthViewMatrix);

        for (const entity of this.entities) {
            entity.mesh.material = entity.material;
            entity.material.uniforms.shadowmap.value = this.shadowmap.texture;
            entity.material.uniforms.depthBiasVP.value = depthMatrix;
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    get element() {
        return this.renderer.domElement;
    }
}
