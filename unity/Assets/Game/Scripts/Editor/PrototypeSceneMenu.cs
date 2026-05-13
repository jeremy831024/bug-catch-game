#if UNITY_EDITOR
using BugCatch.Core;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BugCatch.EditorTools
{
    public static class PrototypeSceneMenu
    {
        [MenuItem("Bug Catch/Create Prototype Scene")]
        public static void CreatePrototypeScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var bootstrap = new GameObject("GameBootstrap");
            bootstrap.AddComponent<GameBootstrap>();
            EditorSceneManager.SaveScene(scene, "Assets/Game/Scenes/Prototype.unity");
            Selection.activeGameObject = bootstrap;
        }
    }
}
#endif
