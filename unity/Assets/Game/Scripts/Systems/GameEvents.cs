using System;
using BugCatch.Data;

namespace BugCatch.Systems
{
    public static class GameEvents
    {
        public static event Action<float, float> StaminaChanged;
        public static event Action<InsectDefinition> InsectCaptured;
        public static event Action<InsectDefinition> InsectObserved;
        public static event Action<InsectDefinition> HazardEncountered;
        public static event Action<int> ScoreChanged;
        public static event Action GameOver;

        public static void RaiseStaminaChanged(float current, float max)
        {
            StaminaChanged?.Invoke(current, max);
        }

        public static void RaiseInsectCaptured(InsectDefinition insect)
        {
            InsectCaptured?.Invoke(insect);
        }

        public static void RaiseInsectObserved(InsectDefinition insect)
        {
            InsectObserved?.Invoke(insect);
        }

        public static void RaiseHazardEncountered(InsectDefinition insect)
        {
            HazardEncountered?.Invoke(insect);
        }

        public static void RaiseScoreChanged(int score)
        {
            ScoreChanged?.Invoke(score);
        }

        public static void RaiseGameOver()
        {
            GameOver?.Invoke();
        }
    }
}
