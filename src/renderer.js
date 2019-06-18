
import {
    Euler,
    FloatType,
    Matrix4,
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
                alpha: true,
            });
        } catch (e) {
            throw new Error('Could not initialize WebGL');
        }

        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setSize(width, height);

        this.width = width;
        this.height = height;

        this.scene = new Scene();

        this.createCamera();
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

        this.scene.add(this.camera);
    }

    createRenderTarget() {
        this.renderTarget = new WebGLRenderTarget(this.width, this.height);
        this.propRT = new WebGLRenderTarget(this.width, this.height);

        this.gridPositionRT = new WebGLRenderTarget(this.width, this.height, {
            type: FloatType,
            format: RGBAFormat,
        });
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.renderTarget.setSize(this.width, this.height);
        this.renderer.setSize(width, height);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    get element() {
        return this.renderer.domElement;
    }
}
