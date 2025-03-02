# Pattern: Protected State

Depending on what reactive primitive you are using it can be useful to protect state changes. This prevents components from manipulating state in unpredictable ways and rather force them to use the functions exposed from the public interface.

```ts
import { reactive } from "bonsify";

function Counter() {
  const state = reactive({
    count: 0,
  });

  return {
    get count() {
      return state.count;
    },
    increase,
  };

  function increase() {
    state.count++;
  }
}
```

Now the `count` can not be changed from components. This pattern is especially useful with data to ensure that all data changes has a related server mutation.

```ts
import { reactive } from "bonsify";

function Post({ post, persistence }) {
  return {
    get id() {
      return post.id;
    },
    get title() {
      return post.title;
    },
    changeTitle,
  };

  function changeTitle(newTitle) {
    post.title = newTitle;
    persistence.posts.update(post.id, {
      title: newTitle,
    });
  }
}

function State({ persistence }) {
  const data = Data({ persistence });

  return {
    get posts() {
      return data.posts.map(createPost);
    },
  };

  function createPost(post) {
    return Post({ post, persistence });
  }
}
```
