using BugCatch.Systems;
using UnityEngine;

namespace BugCatch.Player
{
    [RequireComponent(typeof(CharacterController))]
    public sealed class PlayerController : MonoBehaviour
    {
        [SerializeField] private float moveSpeed = 5.2f;
        [SerializeField] private float sprintSpeed = 7.2f;
        [SerializeField] private float gravity = -18f;
        [SerializeField] private float netRange = 2.4f;
        [SerializeField] private float staminaMax = 100f;
        [SerializeField] private float staminaDrainPerSecond = 1.1f;
        [SerializeField] private float sprintDrainPerSecond = 4.5f;

        private CharacterController _controller;
        private Transform _cameraTransform;
        private float _verticalVelocity;
        private float _stamina;
        private bool _gameOverSent;

        public float NetRange => netRange;
        public float Stamina => _stamina;
        public float StaminaMax => staminaMax;

        private void Awake()
        {
            _controller = GetComponent<CharacterController>();
            _cameraTransform = Camera.main != null ? Camera.main.transform : null;
            _stamina = staminaMax;
            GameEvents.RaiseStaminaChanged(_stamina, staminaMax);
        }

        private void Update()
        {
            if (_gameOverSent)
            {
                return;
            }

            Move();
            DrainStamina();
        }

        public bool ConsumeCaptureEnergy(float amount)
        {
            if (_stamina <= amount)
            {
                return false;
            }

            _stamina = Mathf.Max(0f, _stamina - amount);
            GameEvents.RaiseStaminaChanged(_stamina, staminaMax);
            return true;
        }

        public void RecoverStamina(float amount)
        {
            _stamina = Mathf.Min(staminaMax, _stamina + amount);
            GameEvents.RaiseStaminaChanged(_stamina, staminaMax);
        }

        public void ApplyHazardDamage(float amount)
        {
            _stamina = Mathf.Max(0f, _stamina - amount);
            GameEvents.RaiseStaminaChanged(_stamina, staminaMax);

            if (_stamina <= 0f)
            {
                EndGame();
            }
        }

        private void Move()
        {
            var horizontal = Input.GetAxisRaw("Horizontal");
            var vertical = Input.GetAxisRaw("Vertical");
            var input = new Vector3(horizontal, 0f, vertical).normalized;

            var forward = Vector3.forward;
            var right = Vector3.right;

            if (_cameraTransform != null)
            {
                forward = Vector3.ProjectOnPlane(_cameraTransform.forward, Vector3.up).normalized;
                right = Vector3.ProjectOnPlane(_cameraTransform.right, Vector3.up).normalized;
            }

            var desired = (forward * input.z + right * input.x).normalized;
            var sprinting = Input.GetKey(KeyCode.LeftShift) && _stamina > 8f && input.sqrMagnitude > 0.1f;
            var speed = sprinting ? sprintSpeed : moveSpeed;

            if (desired.sqrMagnitude > 0.01f)
            {
                transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(desired), Time.deltaTime * 12f);
            }

            if (_controller.isGrounded && _verticalVelocity < 0f)
            {
                _verticalVelocity = -1f;
            }

            _verticalVelocity += gravity * Time.deltaTime;
            var motion = desired * speed + Vector3.up * _verticalVelocity;
            _controller.Move(motion * Time.deltaTime);

            if (sprinting)
            {
                _stamina = Mathf.Max(0f, _stamina - sprintDrainPerSecond * Time.deltaTime);
                GameEvents.RaiseStaminaChanged(_stamina, staminaMax);
            }
        }

        private void DrainStamina()
        {
            _stamina = Mathf.Max(0f, _stamina - staminaDrainPerSecond * Time.deltaTime);
            GameEvents.RaiseStaminaChanged(_stamina, staminaMax);

            if (_stamina <= 0f)
            {
                EndGame();
            }
        }

        private void EndGame()
        {
            if (_gameOverSent)
            {
                return;
            }

            _gameOverSent = true;
            GameEvents.RaiseGameOver();
        }
    }
}
