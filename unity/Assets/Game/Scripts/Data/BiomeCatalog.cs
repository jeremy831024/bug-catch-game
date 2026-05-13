using System.Collections.Generic;
using UnityEngine;

namespace BugCatch.Data
{
    [System.Serializable]
    public sealed class BiomeDefinition
    {
        public string id;
        public string displayName;
        public Color groundColor;
        public float staminaDrainMultiplier;
        public string gameplayNote;
    }

    public static class BiomeCatalog
    {
        public static IReadOnlyList<BiomeDefinition> InitialBiomes => _initialBiomes;

        private static readonly BiomeDefinition[] _initialBiomes =
        {
            new BiomeDefinition
            {
                id = "grassland",
                displayName = "草地",
                groundColor = new Color(0.35f, 0.67f, 0.28f),
                staminaDrainMultiplier = 1f,
                gameplayNote = "安全区和普通虫基础区域"
            },
            new BiomeDefinition
            {
                id = "lake",
                displayName = "湖泊",
                groundColor = new Color(0.16f, 0.43f, 0.82f),
                staminaDrainMultiplier = 0f,
                gameplayNote = "障碍物，不可通行"
            },
            new BiomeDefinition
            {
                id = "hill",
                displayName = "山地",
                groundColor = new Color(0.44f, 0.38f, 0.22f),
                staminaDrainMultiplier = 1.2f,
                gameplayNote = "后续用于速度和体力惩罚"
            }
        };
    }
}
