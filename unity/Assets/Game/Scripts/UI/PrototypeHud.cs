using BugCatch.Data;
using BugCatch.Systems;
using UnityEngine;

namespace BugCatch.UI
{
    public sealed class PrototypeHud : MonoBehaviour
    {
        private float _staminaCurrent = 100f;
        private float _staminaMax = 100f;
        private int _score;
        private string _message = "WASD 移动，Shift 奔跑，E/Space 捕捉或观察";
        private float _messageUntil;
        private bool _gameOver;

        private void OnEnable()
        {
            GameEvents.StaminaChanged += OnStaminaChanged;
            GameEvents.ScoreChanged += OnScoreChanged;
            GameEvents.InsectCaptured += OnInsectCaptured;
            GameEvents.InsectObserved += OnInsectObserved;
            GameEvents.HazardEncountered += OnHazardEncountered;
            GameEvents.GameOver += OnGameOver;
        }

        private void OnDisable()
        {
            GameEvents.StaminaChanged -= OnStaminaChanged;
            GameEvents.ScoreChanged -= OnScoreChanged;
            GameEvents.InsectCaptured -= OnInsectCaptured;
            GameEvents.InsectObserved -= OnInsectObserved;
            GameEvents.HazardEncountered -= OnHazardEncountered;
            GameEvents.GameOver -= OnGameOver;
        }

        private void OnGUI()
        {
            var style = new GUIStyle(GUI.skin.box)
            {
                fontSize = 18,
                alignment = TextAnchor.MiddleLeft,
                padding = new RectOffset(14, 14, 10, 10)
            };

            GUI.Box(new Rect(18, 18, 360, 122), "", style);
            GUI.Label(new Rect(34, 32, 320, 28), $"体力：{Mathf.CeilToInt(_staminaCurrent)} / {Mathf.CeilToInt(_staminaMax)}");
            GUI.Label(new Rect(34, 62, 320, 28), $"分数：{_score}");
            GUI.Label(new Rect(34, 92, 320, 28), $"最佳：{PlayerPrefs.GetInt("best_score", 0)}");

            var barWidth = 250f * Mathf.Clamp01(_staminaCurrent / Mathf.Max(1f, _staminaMax));
            GUI.color = new Color(0.2f, 0.75f, 0.3f);
            GUI.DrawTexture(new Rect(104, 38, barWidth, 12), Texture2D.whiteTexture);
            GUI.color = Color.white;

            if (Time.time < _messageUntil || !_gameOver)
            {
                GUI.Box(new Rect(18, Screen.height - 74, Mathf.Min(Screen.width - 36, 720), 48), _message);
            }

            if (_gameOver)
            {
                var gameOverStyle = new GUIStyle(GUI.skin.box)
                {
                    fontSize = 30,
                    alignment = TextAnchor.MiddleCenter,
                    padding = new RectOffset(16, 16, 16, 16)
                };
                GUI.Box(new Rect(Screen.width * 0.5f - 180f, Screen.height * 0.5f - 70f, 360f, 140f), "体力耗尽\n本局结束", gameOverStyle);
            }
        }

        private void OnStaminaChanged(float current, float max)
        {
            _staminaCurrent = current;
            _staminaMax = max;
        }

        private void OnScoreChanged(int score)
        {
            _score = score;
        }

        private void OnInsectCaptured(InsectDefinition insect)
        {
            ShowMessage($"捕捉成功：{insect.displayName} +{insect.scoreValue}");
        }

        private void OnInsectObserved(InsectDefinition insect)
        {
            ShowMessage($"观察记录：{insect.displayName}，该物种暂不捕捉");
        }

        private void OnHazardEncountered(InsectDefinition insect)
        {
            ShowMessage($"危险：{insect.displayName}，远离巢穴区域");
        }

        private void OnGameOver()
        {
            _gameOver = true;
            ShowMessage("体力耗尽，本局结束。排行榜和图鉴数据已保存。");
        }

        private void ShowMessage(string message)
        {
            _message = message;
            _messageUntil = Time.time + 3.6f;
        }
    }
}
