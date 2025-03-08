# Pattern: Protected State

Depending on what reactive primitive you are using it can be useful to protect state changes. This prevents components from manipulating state in unpredictable ways and rather force them to use the functions exposed from the public interface.

This is how **Bonsify** handles protecting state:

```ts
import { reactive } from "bonsify";

function Counter() {
  const counter = reactive({
    count: 0,
    increase,
  });

  return reactive.readonly(counter);

  function increase() {
    counter.count++;
  }
}
```

Now the `count` can not be changed from components. This pattern is especially useful with data to ensure that all data changes has a related server mutation.

```ts
import { reactive } from "bonsify";

function Post({ data, persistence }) {
  const post = reactive({
    ...data,
    changeTitle,
  });

  return reactive.readonly(post);

  function changeTitle(newTitle) {
    post.title = newTitle;
    persistence.posts.update(post.id, {
      title: newTitle,
    });
  }
}

function Data({ persistence }) {
  const data = reactive({
    posts: [],
  });

  persistence.posts.fetch().then((posts) => {
    data.posts = posts.map(createPost);
  });

  return reactive.readonly(data);

  function createPost(post) {
    return Post({ post, persistence });
  }
}
```
