using BugCatch.Data;
using BugCatch.Insects;
using BugCatch.Systems;
using UnityEngine;

namespace BugCatch.Player
{
    [RequireComponent(typeof(PlayerController))]
    public sealed class CaptureController : MonoBehaviour
    {
        [SerializeField] private float captureEnergyCost = 3f;
        [SerializeField] private LayerMask insectMask = ~0;

        private PlayerController _player;
        private float _feedbackUntil;

        private void Awake()
        {
            _player = GetComponent<PlayerController>();
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.E))
            {
                TryInteract();
            }
        }

        private void TryInteract()
        {
            if (!_player.ConsumeCaptureEnergy(captureEnergyCost))
            {
                return;
            }

            var hits = Physics.OverlapSphere(transform.position, _player.NetRange, insectMask, QueryTriggerInteraction.Collide);
            InsectAgent nearest = null;
            var nearestDistance = float.MaxValue;

            foreach (var hit in hits)
            {
                var insect = hit.GetComponentInParent<InsectAgent>();
                if (insect == null || insect.IsResolved)
                {
                    continue;
                }

                var distance = Vector3.Distance(transform.position, insect.transform.position);
                if (distance < nearestDistance)
                {
                    nearestDistance = distance;
                    nearest = insect;
                }
            }

            if (nearest == null)
            {
                _feedbackUntil = Time.time + 0.18f;
                return;
            }

            switch (nearest.Definition.safetyTag)
            {
                case InsectSafetyTag.Catchable:
                    nearest.Resolve();
                    GameEvents.RaiseInsectCaptured(nearest.Definition);
                    break;
                case InsectSafetyTag.ObserveOnly:
                    nearest.Resolve();
                    GameEvents.RaiseInsectObserved(nearest.Definition);
                    break;
                case InsectSafetyTag.Hazard:
                    GameEvents.RaiseHazardEncountered(nearest.Definition);
                    _player.ApplyHazardDamage(18f);
                    break;
            }
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = Time.time < _feedbackUntil ? Color.yellow : new Color(1f, 1f, 1f, 0.25f);
            Gizmos.DrawWireSphere(transform.position, Application.isPlaying && _player != null ? _player.NetRange : 2.4f);
        }
    }
}
