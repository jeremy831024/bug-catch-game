using System.Collections.Generic;
using UnityEngine;

namespace BugCatch.Data
{
    public enum InsectSafetyTag
    {
        Catchable,
        ObserveOnly,
        Hazard
    }

    public enum InsectCaptureMode
    {
        NetCapture,
        PhotoOnly,
        HazardEvent
    }

    public enum InsectMovementType
    {
        Ground,
        Hop,
        Fly,
        TreePerch,
        HazardSwarm
    }

    [System.Serializable]
    public sealed class InsectDefinition
    {
        public string id;
        public string displayName;
        public string speciesGroup;
        public InsectSafetyTag safetyTag;
        public InsectCaptureMode captureMode;
        public InsectMovementType movementType;
        public string activeTime;
        public string hideHabit;
        public string socialType;
        public string audioCue;
        public string visualCue;
        public int scoreValue;
        public float speed;
        public float spawnWeight;
        public float captureRadius;
        public Color bodyColor;
        public Color accentColor;
        public string sourceNote;

        public bool IsCatchable => safetyTag == InsectSafetyTag.Catchable && captureMode == InsectCaptureMode.NetCapture;
    }

    public static class InsectCatalog
    {
        public static IReadOnlyList<InsectDefinition> InitialRoster => _initialRoster;

        private static readonly InsectDefinition[] _initialRoster =
        {
            new InsectDefinition
            {
                id = "grasshopper",
                displayName = "蚂蚱",
                speciesGroup = "grasshopper",
                safetyTag = InsectSafetyTag.Catchable,
                captureMode = InsectCaptureMode.NetCapture,
                movementType = InsectMovementType.Hop,
                activeTime = "day",
                hideHabit = "grass",
                socialType = "smallGroup",
                audioCue = "short grass rustle",
                visualCue = "grass shake and jump arc",
                scoreValue = 10,
                speed = 4.6f,
                spawnWeight = 1.4f,
                captureRadius = 1.7f,
                bodyColor = new Color(0.32f, 0.73f, 0.28f),
                accentColor = new Color(0.85f, 0.95f, 0.45f),
                sourceNote = "草地基础教学虫"
            },
            new InsectDefinition
            {
                id = "copper-chafer",
                displayName = "铜绿丽金龟",
                speciesGroup = "beetle",
                safetyTag = InsectSafetyTag.Catchable,
                captureMode = InsectCaptureMode.NetCapture,
                movementType = InsectMovementType.Fly,
                activeTime = "dusk-night",
                hideHabit = "tree",
                socialType = "solo",
                audioCue = "clear wing buzz near light",
                visualCue = "green shell glint",
                scoreValue = 35,
                speed = 3.1f,
                spawnWeight = 0.8f,
                captureRadius = 1.45f,
                bodyColor = new Color(0.1f, 0.62f, 0.37f),
                accentColor = new Color(0.92f, 0.72f, 0.22f),
                sourceNote = "北京常见候选，趋光玩法"
            },
            new InsectDefinition
            {
                id = "cricket",
                displayName = "蟋蟀",
                speciesGroup = "cricket",
                safetyTag = InsectSafetyTag.Catchable,
                captureMode = InsectCaptureMode.NetCapture,
                movementType = InsectMovementType.Hop,
                activeTime = "night",
                hideHabit = "burrow",
                socialType = "solo",
                audioCue = "chirp gets louder when close",
                visualCue = "grass tremble near burrow",
                scoreValue = 25,
                speed = 3.8f,
                spawnWeight = 0.9f,
                captureRadius = 1.35f,
                bodyColor = new Color(0.38f, 0.24f, 0.13f),
                accentColor = new Color(0.82f, 0.69f, 0.42f),
                sourceNote = "夜间声音定位虫"
            },
            new InsectDefinition
            {
                id = "cabbage-white",
                displayName = "菜粉蝶",
                speciesGroup = "butterfly",
                safetyTag = InsectSafetyTag.Catchable,
                captureMode = InsectCaptureMode.NetCapture,
                movementType = InsectMovementType.Fly,
                activeTime = "day",
                hideHabit = "flower",
                socialType = "pair",
                audioCue = "soft wing flutter",
                visualCue = "pale wing trail",
                scoreValue = 20,
                speed = 2.8f,
                spawnWeight = 1.1f,
                captureRadius = 1.55f,
                bodyColor = new Color(0.96f, 0.95f, 0.82f),
                accentColor = new Color(0.5f, 0.52f, 0.6f),
                sourceNote = "北京常见蝴蝶参考"
            },
            new InsectDefinition
            {
                id = "stag-flower-beetle",
                displayName = "鹿角花金龟",
                speciesGroup = "beetle",
                safetyTag = InsectSafetyTag.ObserveOnly,
                captureMode = InsectCaptureMode.PhotoOnly,
                movementType = InsectMovementType.TreePerch,
                activeTime = "dusk",
                hideHabit = "tree-sap",
                socialType = "solo",
                audioCue = "deep wing buzz",
                visualCue = "large beetle silhouette on trunk",
                scoreValue = 0,
                speed = 1.7f,
                spawnWeight = 0.25f,
                captureRadius = 0f,
                bodyColor = new Color(0.19f, 0.12f, 0.08f),
                accentColor = new Color(0.74f, 0.46f, 0.16f),
                sourceNote = "候选高价值物种，正式捕捉前需核验"
            },
            new InsectDefinition
            {
                id = "hornet-swarm",
                displayName = "胡蜂群",
                speciesGroup = "predator",
                safetyTag = InsectSafetyTag.Hazard,
                captureMode = InsectCaptureMode.HazardEvent,
                movementType = InsectMovementType.HazardSwarm,
                activeTime = "day",
                hideHabit = "nest",
                socialType = "swarm",
                audioCue = "urgent high buzz",
                visualCue = "danger boundary around nest",
                scoreValue = 0,
                speed = 5.5f,
                spawnWeight = 0.25f,
                captureRadius = 0f,
                bodyColor = new Color(0.92f, 0.72f, 0.16f),
                accentColor = new Color(0.12f, 0.1f, 0.08f),
                sourceNote = "危险不可捕捉"
            }
        };
    }
}
