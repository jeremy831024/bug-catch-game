using System.Collections.Generic;
using BugCatch.Data;
using BugCatch.Gameplay;
using BugCatch.Insects;
using UnityEngine;

namespace BugCatch.Gameplay
{
    public sealed class WorldGenerator : MonoBehaviour
    {
        [SerializeField] private int treeCount = 18;
        [SerializeField] private int foodCount = 12;
        [SerializeField] private int insectCount = 22;
        [SerializeField] private int hazardCount = 5;
        [SerializeField] private Vector2 worldSize = new Vector2(64f, 64f);

        private readonly List<Bounds> _blockedAreas = new List<Bounds>();

        public void Generate(Transform player)
        {
            CreateGround();
            CreateLake(new Vector3(8f, 0.04f, 8f), new Vector3(13f, 0.08f, 9f));
            CreateHill(new Vector3(-16f, 0.45f, 11f), new Vector3(9f, 0.9f, 7f));
            ScatterTrees();
            ScatterFood();
            ScatterHazards();
            ScatterInsects(player);
        }

        private void CreateGround()
        {
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Generated Grass Field";
            ground.transform.SetParent(transform);
            ground.transform.position = new Vector3(0f, -0.06f, 0f);
            ground.transform.localScale = new Vector3(worldSize.x, 0.1f, worldSize.y);
            ApplyMaterial(ground, new Color(0.35f, 0.67f, 0.28f));
        }

        private void CreateLake(Vector3 position, Vector3 scale)
        {
            var lake = GameObject.CreatePrimitive(PrimitiveType.Cube);
            lake.name = "Lake Obstacle";
            lake.transform.SetParent(transform);
            lake.transform.position = position;
            lake.transform.localScale = scale;
            ApplyMaterial(lake, new Color(0.16f, 0.43f, 0.82f, 0.85f));
            _blockedAreas.Add(new Bounds(position, new Vector3(scale.x + 2f, 2f, scale.z + 2f)));
        }

        private void CreateHill(Vector3 position, Vector3 scale)
        {
            var hill = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            hill.name = "Low Mountain Placeholder";
            hill.transform.SetParent(transform);
            hill.transform.position = position;
            hill.transform.localScale = scale;
            ApplyMaterial(hill, new Color(0.44f, 0.38f, 0.22f));
            _blockedAreas.Add(new Bounds(position, new Vector3(scale.x + 1f, 2f, scale.z + 1f)));
        }

        private void ScatterTrees()
        {
            for (var i = 0; i < treeCount; i++)
            {
                var position = FindFreePosition();
                CreateTree(position);
            }
        }

        private void CreateTree(Vector3 position)
        {
            var root = new GameObject("Cube Tree");
            root.transform.SetParent(transform);
            root.transform.position = position;

            var trunk = GameObject.CreatePrimitive(PrimitiveType.Cube);
            trunk.name = "Trunk";
            trunk.transform.SetParent(root.transform);
            trunk.transform.localPosition = new Vector3(0f, 1f, 0f);
            trunk.transform.localScale = new Vector3(0.65f, 2f, 0.65f);
            ApplyMaterial(trunk, new Color(0.43f, 0.24f, 0.12f));

            var canopy = GameObject.CreatePrimitive(PrimitiveType.Cube);
            canopy.name = "Cube Canopy";
            canopy.transform.SetParent(root.transform);
            canopy.transform.localPosition = new Vector3(0f, 2.5f, 0f);
            canopy.transform.localScale = new Vector3(2.4f, 1.8f, 2.4f);
            ApplyMaterial(canopy, new Color(0.18f, 0.48f, 0.22f));

            _blockedAreas.Add(new Bounds(position, new Vector3(2.2f, 4f, 2.2f)));
        }

        private void ScatterFood()
        {
            for (var i = 0; i < foodCount; i++)
            {
                var item = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                item.name = "Food Pickup";
                item.transform.SetParent(transform);
                item.transform.position = FindFreePosition() + Vector3.up * 0.45f;
                item.transform.localScale = Vector3.one * 0.55f;
                item.GetComponent<Collider>().isTrigger = true;
                item.AddComponent<PickupItem>();
                ApplyMaterial(item, new Color(0.95f, 0.55f, 0.22f));
            }
        }

        private void ScatterHazards()
        {
            for (var i = 0; i < hazardCount; i++)
            {
                var hazard = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                hazard.name = "Poison Mushroom Patch";
                hazard.transform.SetParent(transform);
                hazard.transform.position = FindFreePosition() + Vector3.up * 0.12f;
                hazard.transform.localScale = new Vector3(1.3f, 0.25f, 1.3f);
                hazard.GetComponent<Collider>().isTrigger = true;
                hazard.AddComponent<HazardZone>();
                ApplyMaterial(hazard, new Color(0.72f, 0.18f, 0.72f));
            }
        }

        private void ScatterInsects(Transform player)
        {
            var roster = InsectCatalog.InitialRoster;
            for (var i = 0; i < insectCount; i++)
            {
                var definition = PickWeighted(roster);
                var insect = CreateInsectPlaceholder(definition);
                insect.transform.SetParent(transform);
                insect.transform.position = FindFreePosition() + Vector3.up * 0.3f;
                insect.AddComponent<InsectAgent>().Initialize(definition, player);
            }
        }

        private GameObject CreateInsectPlaceholder(InsectDefinition definition)
        {
            var shape = definition.speciesGroup == "butterfly" ? PrimitiveType.Cube : PrimitiveType.Sphere;
            var root = GameObject.CreatePrimitive(shape);
            root.name = $"Insect - {definition.displayName}";
            root.transform.localScale = definition.speciesGroup == "butterfly"
                ? new Vector3(0.95f, 0.12f, 0.55f)
                : new Vector3(0.55f, 0.35f, 0.75f);
            root.layer = 0;
            ApplyMaterial(root, definition.bodyColor);
            return root;
        }

        private InsectDefinition PickWeighted(IReadOnlyList<InsectDefinition> roster)
        {
            var total = 0f;
            foreach (var item in roster)
            {
                total += item.spawnWeight;
            }

            var roll = Random.value * total;
            foreach (var item in roster)
            {
                roll -= item.spawnWeight;
                if (roll <= 0f)
                {
                    return item;
                }
            }

            return roster[0];
        }

        private Vector3 FindFreePosition()
        {
            for (var attempt = 0; attempt < 100; attempt++)
            {
                var position = new Vector3(
                    Random.Range(-worldSize.x * 0.45f, worldSize.x * 0.45f),
                    0f,
                    Random.Range(-worldSize.y * 0.45f, worldSize.y * 0.45f));

                if (position.magnitude < 4f || IsBlocked(position))
                {
                    continue;
                }

                return position;
            }

            return new Vector3(Random.Range(-10f, 10f), 0f, Random.Range(-10f, 10f));
        }

        private bool IsBlocked(Vector3 position)
        {
            foreach (var area in _blockedAreas)
            {
                if (area.Contains(position))
                {
                    return true;
                }
            }

            return false;
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
