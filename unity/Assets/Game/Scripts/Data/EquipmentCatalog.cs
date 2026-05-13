using System.Collections.Generic;

namespace BugCatch.Data
{
    public enum EquipmentSlot
    {
        Head,
        Body,
        Shoes,
        Back,
        Tool
    }

    [System.Serializable]
    public sealed class EquipmentDefinition
    {
        public string id;
        public string displayName;
        public EquipmentSlot slot;
        public float moveSpeedBonus;
        public float staminaBonus;
        public float poisonResistanceBonus;
        public string gameplayNote;
    }

    public static class EquipmentCatalog
    {
        public static IReadOnlyList<EquipmentDefinition> InitialEquipment => _initialEquipment;

        private static readonly EquipmentDefinition[] _initialEquipment =
        {
            new EquipmentDefinition
            {
                id = "straw-hat",
                displayName = "草帽",
                slot = EquipmentSlot.Head,
                staminaBonus = 8f,
                gameplayNote = "默认探索装备，降低夏季消耗感"
            },
            new EquipmentDefinition
            {
                id = "rain-boots",
                displayName = "雨靴",
                slot = EquipmentSlot.Shoes,
                moveSpeedBonus = -0.2f,
                poisonResistanceBonus = 0.15f,
                gameplayNote = "适合沼泽和雨天"
            },
            new EquipmentDefinition
            {
                id = "bug-net",
                displayName = "捕虫网",
                slot = EquipmentSlot.Tool,
                gameplayNote = "第一版默认工具，负责近距离捕捉"
            }
        };
    }
}
