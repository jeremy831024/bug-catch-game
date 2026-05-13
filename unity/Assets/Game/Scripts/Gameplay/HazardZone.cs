using BugCatch.Player;
using UnityEngine;

namespace BugCatch.Gameplay
{
    public sealed class HazardZone : MonoBehaviour
    {
        [SerializeField] private float staminaDamagePerSecond = 12f;
        [SerializeField] private float slowMultiplier = 0.55f;

        private void OnTriggerStay(Collider other)
        {
            var player = other.GetComponentInParent<PlayerController>();
            if (player == null)
            {
                return;
            }

            player.ApplyHazardDamage(staminaDamagePerSecond * Time.deltaTime);
        }

        private void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(0.6f, 0.1f, 0.8f, 0.25f);
            Gizmos.DrawCube(transform.position, transform.localScale);
        }
    }
}
