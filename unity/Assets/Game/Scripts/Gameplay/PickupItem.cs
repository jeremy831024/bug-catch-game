using BugCatch.Player;
using UnityEngine;

namespace BugCatch.Gameplay
{
    public sealed class PickupItem : MonoBehaviour
    {
        [SerializeField] private float staminaRestore = 28f;
        [SerializeField] private float spinSpeed = 90f;

        private void Update()
        {
            transform.Rotate(Vector3.up, spinSpeed * Time.deltaTime, Space.World);
        }

        private void OnTriggerEnter(Collider other)
        {
            var player = other.GetComponentInParent<PlayerController>();
            if (player == null)
            {
                return;
            }

            player.RecoverStamina(staminaRestore);
            gameObject.SetActive(false);
        }
    }
}
