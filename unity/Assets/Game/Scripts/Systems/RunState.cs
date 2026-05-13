using System.Collections.Generic;
using BugCatch.Data;
using UnityEngine;

namespace BugCatch.Systems
{
    public sealed class RunState : MonoBehaviour
    {
        public int Score { get; private set; }
        public float SurvivalSeconds { get; private set; }
        public bool IsGameOver { get; private set; }

        private readonly Dictionary<string, int> _captured = new Dictionary<string, int>();
        private readonly HashSet<string> _observed = new HashSet<string>();
        private readonly HashSet<string> _hazards = new HashSet<string>();

        private void OnEnable()
        {
            GameEvents.InsectCaptured += OnInsectCaptured;
            GameEvents.InsectObserved += OnInsectObserved;
            GameEvents.HazardEncountered += OnHazardEncountered;
            GameEvents.GameOver += OnGameOver;
        }

        private void OnDisable()
        {
            GameEvents.InsectCaptured -= OnInsectCaptured;
            GameEvents.InsectObserved -= OnInsectObserved;
            GameEvents.HazardEncountered -= OnHazardEncountered;
            GameEvents.GameOver -= OnGameOver;
        }

        private void Update()
        {
            if (!IsGameOver)
            {
                SurvivalSeconds += Time.deltaTime;
            }
        }

        public IReadOnlyDictionary<string, int> Captured => _captured;
        public IReadOnlyCollection<string> Observed => _observed;
        public IReadOnlyCollection<string> Hazards => _hazards;

        private void OnInsectCaptured(InsectDefinition insect)
        {
            if (!_captured.ContainsKey(insect.id))
            {
                _captured[insect.id] = 0;
            }

            _captured[insect.id]++;
            Score += insect.scoreValue;
            GameEvents.RaiseScoreChanged(Score);
        }

        private void OnInsectObserved(InsectDefinition insect)
        {
            _observed.Add(insect.id);
        }

        private void OnHazardEncountered(InsectDefinition insect)
        {
            _hazards.Add(insect.id);
        }

        private void OnGameOver()
        {
            IsGameOver = true;
            SaveRun();
        }

        private void SaveRun()
        {
            var bestScore = PlayerPrefs.GetInt("best_score", 0);
            var bestSurvival = PlayerPrefs.GetFloat("best_survival_seconds", 0f);
            PlayerPrefs.SetInt("last_score", Score);
            PlayerPrefs.SetFloat("last_survival_seconds", SurvivalSeconds);

            if (Score > bestScore)
            {
                PlayerPrefs.SetInt("best_score", Score);
            }

            if (SurvivalSeconds > bestSurvival)
            {
                PlayerPrefs.SetFloat("best_survival_seconds", SurvivalSeconds);
            }

            foreach (var item in _captured)
            {
                PlayerPrefs.SetInt($"collection_captured_{item.Key}", PlayerPrefs.GetInt($"collection_captured_{item.Key}", 0) + item.Value);
            }

            foreach (var item in _observed)
            {
                PlayerPrefs.SetInt($"collection_observed_{item}", 1);
            }

            foreach (var item in _hazards)
            {
                PlayerPrefs.SetInt($"collection_hazard_{item}", 1);
            }

            PlayerPrefs.Save();
        }
    }
}
