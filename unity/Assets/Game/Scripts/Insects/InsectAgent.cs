using BugCatch.Data;
using BugCatch.Player;
using BugCatch.Systems;
using UnityEngine;

namespace BugCatch.Insects
{
    [RequireComponent(typeof(Collider))]
    public sealed class InsectAgent : MonoBehaviour
    {
        [SerializeField] private float awarenessRadius = 7f;
        [SerializeField] private float fleeRadius = 3.2f;
        [SerializeField] private float hazardTickSeconds = 1.2f;

        private Vector3 _home;
        private Vector3 _wanderTarget;
        private Transform _player;
        private float _nextWanderAt;
        private float _nextHazardAt;
        private float _bobSeed;
        private Renderer _renderer;

        public InsectDefinition Definition { get; private set; }
        public bool IsResolved { get; private set; }

        public void Initialize(InsectDefinition definition, Transform player)
        {
            Definition = definition;
            _player = player;
            _home = transform.position;
            _wanderTarget = _home;
            _bobSeed = Random.value * 10f;
            _renderer = GetComponentInChildren<Renderer>();
            ApplyMaterial();
        }

        private void Update()
        {
            if (Definition == null || IsResolved)
            {
                return;
            }

            AnimatePlaceholder();
            Think();
        }

        public void Resolve()
        {
            if (IsResolved)
            {
                return;
            }

            IsResolved = true;
            gameObject.SetActive(false);
        }

        private void Think()
        {
            if (_player == null)
            {
                return;
            }

            var toPlayer = _player.position - transform.position;
            var distance = toPlayer.magnitude;

            if (Definition.safetyTag == InsectSafetyTag.Hazard)
            {
                HandleHazard(distance, toPlayer);
                return;
            }

            if (distance < fleeRadius && Definition.captureMode == InsectCaptureMode.NetCapture)
            {
                MoveAwayFrom(toPlayer.normalized);
            }
            else
            {
                Wander();
            }

            UpdateProximityCue(distance);
        }

        private void HandleHazard(float distance, Vector3 toPlayer)
        {
            if (distance < awarenessRadius)
            {
                var direction = toPlayer.sqrMagnitude > 0.01f ? toPlayer.normalized : Random.onUnitSphere;
                Move(direction, Definition.speed * 0.75f);
            }
            else
            {
                Wander();
            }

            if (distance < 2.4f && Time.time >= _nextHazardAt)
            {
                _nextHazardAt = Time.time + hazardTickSeconds;
                GameEvents.RaiseHazardEncountered(Definition);

                var player = _player.GetComponent<PlayerController>();
                if (player != null)
                {
                    player.ApplyHazardDamage(8f);
                }
            }

            UpdateProximityCue(distance);
        }

        private void MoveAwayFrom(Vector3 directionToPlayer)
        {
            Move(-directionToPlayer, Definition.speed);
        }

        private void Wander()
        {
            if (Time.time >= _nextWanderAt || Vector3.Distance(transform.position, _wanderTarget) < 0.6f)
            {
                _nextWanderAt = Time.time + Random.Range(1.2f, 3.2f);
                var random = Random.insideUnitCircle * Random.Range(2f, 5.5f);
                _wanderTarget = _home + new Vector3(random.x, 0f, random.y);
            }

            var direction = _wanderTarget - transform.position;
            direction.y = 0f;

            if (direction.sqrMagnitude > 0.2f)
            {
                Move(direction.normalized, Definition.speed * 0.35f);
            }
        }

        private void Move(Vector3 direction, float speed)
        {
            direction.y = 0f;

            if (direction.sqrMagnitude < 0.01f)
            {
                return;
            }

            var next = transform.position + direction.normalized * speed * Time.deltaTime;
            next.x = Mathf.Clamp(next.x, -28f, 28f);
            next.z = Mathf.Clamp(next.z, -28f, 28f);
            transform.position = next;
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), Time.deltaTime * 8f);
        }

        private void AnimatePlaceholder()
        {
            var baseHeight = Definition.movementType == InsectMovementType.Fly || Definition.movementType == InsectMovementType.TreePerch ? 1.1f : 0.25f;
            var bob = Mathf.Sin((Time.time + _bobSeed) * 4f) * 0.12f;
            var position = transform.position;
            position.y = baseHeight + bob;
            transform.position = position;
        }

        private void UpdateProximityCue(float distance)
        {
            if (_renderer == null)
            {
                return;
            }

            var t = Mathf.InverseLerp(awarenessRadius, 1.2f, distance);
            var scale = Mathf.Lerp(1f, 1.18f, t);
            transform.localScale = Vector3.one * scale;

            var material = _renderer.material;
            material.color = Color.Lerp(Definition.bodyColor, Definition.accentColor, t * 0.35f);
        }

        private void ApplyMaterial()
        {
            if (_renderer == null)
            {
                return;
            }

            _renderer.material = new Material(Shader.Find("Standard"))
            {
                color = Definition.bodyColor
            };
        }
    }
}
