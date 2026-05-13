using BugCatch.Gameplay;
using BugCatch.Player;
using BugCatch.Systems;
using BugCatch.UI;
using UnityEngine;

namespace BugCatch.Core
{
    public sealed class GameBootstrap : MonoBehaviour
    {
        private void Awake()
        {
            Random.InitState(System.DateTime.Now.Millisecond);
            CreateLighting();
            var player = CreatePlayer();
            CreateCamera(player.transform);
            CreateSystems(player.transform);
            CreateHud();
        }

        private GameObject CreatePlayer()
        {
            var player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            player.name = "Player - Preset Explorer Placeholder";
            player.transform.position = new Vector3(0f, 1f, 0f);
            player.transform.localScale = new Vector3(0.85f, 1f, 0.85f);

            var collider = player.GetComponent<CapsuleCollider>();
            if (collider != null)
            {
                Destroy(collider);
            }

            var controller = player.AddComponent<CharacterController>();
            controller.height = 2f;
            controller.radius = 0.42f;
            controller.center = new Vector3(0f, 1f, 0f);
            player.AddComponent<PlayerController>();
            player.AddComponent<CaptureController>();
            ApplyMaterial(player, new Color(0.95f, 0.62f, 0.22f));

            var headLight = new GameObject("Player Head Glow");
            headLight.transform.SetParent(player.transform);
            headLight.transform.localPosition = new Vector3(0f, 2.35f, 0f);
            var light = headLight.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = new Color(1f, 0.88f, 0.62f);
            light.range = 8f;
            light.intensity = 1.2f;

            return player;
        }

        private void CreateCamera(Transform player)
        {
            var cameraObject = new GameObject("Third Person Camera");
            var camera = cameraObject.AddComponent<Camera>();
            camera.fieldOfView = 58f;
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 180f;
            cameraObject.transform.position = player.position + new Vector3(0f, 7f, -8f);
            cameraObject.AddComponent<AudioListener>();
            cameraObject.AddComponent<FollowCamera>().SetTarget(player);
        }

        private void CreateSystems(Transform player)
        {
            var systems = new GameObject("Runtime Systems");
            systems.AddComponent<RunState>();
            var generator = systems.AddComponent<WorldGenerator>();
            generator.Generate(player);
        }

        private void CreateHud()
        {
            var hudObject = new GameObject("HUD");
            hudObject.AddComponent<PrototypeHud>();
        }

        private void CreateLighting()
        {
            RenderSettings.ambientLight = new Color(0.62f, 0.76f, 0.92f);

            var sunObject = new GameObject("Sun Directional Light");
            sunObject.transform.rotation = Quaternion.Euler(48f, -35f, 0f);
            var sun = sunObject.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.color = new Color(1f, 0.92f, 0.74f);
            sun.intensity = 1.1f;
        }

        private static void ApplyMaterial(GameObject target, Color color)
        {
            var renderer = target.GetComponent<Renderer>();
            if (renderer == null)
            {
                return;
            }

            renderer.material = new Material(Shader.Find("Standard"))
            {
                color = color
            };
        }
    }
}
