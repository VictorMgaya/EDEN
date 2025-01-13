import { signIn } from "next-auth/react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSocialLogin = (provider) => {
    signIn(provider).catch(() => setError("Social login failed."));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-md p-8 bg-green-500/10 rounded-lg">
        <Link href="/" className="flex items-center justify-center mb-6">
          <Image src="/eden.svg" alt="Eden Logo" width={64} height={64} className="h-16 md:h-20" />
        </Link>
        <h1 className="text-2xl font-bold text-center text-green-500">
          {isLogin ? "Welcome back!" : "Create an account"}
        </h1>
        <div className="flex flex-col gap-4 mt-4">
          <button
            onClick={() => handleSocialLogin("google")}
            className="bg-red-600 text-white p-3 rounded-lg text-lg hover:bg-red-700 transition duration-300"
          >
            Continue with Google
          </button>
          <button
            onClick={() => handleSocialLogin("azure-ad")}
            className="bg-blue-600 text-white p-3 rounded-lg text-lg hover:bg-blue-700 transition duration-300"
          >
            Continue with Microsoft
          </button>
          <button
            onClick={() => handleSocialLogin("apple")}
            className="bg-black text-white p-3 rounded-lg text-lg hover:bg-gray-800 transition duration-300"
          >
            Continue with Apple
          </button>
        </div>
        <p className="text-center my-4">or</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border border-gray-300 rounded-lg p-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-lg text-lg hover:bg-blue-700 transition duration-300"
          >
            {isLogin ? "Login" : "Register"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-sm text-center">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-blue-500 underline"
            >
              {isLogin ? "Register here" : "Login here"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
