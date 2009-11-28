require File.join(File.dirname(__FILE__), 'spec_helper')
libs %w{jsbuild}

describe JS::Module do
  before do
    JS::Module.clear_files
    @output = StringIO.new("", 'w')
  end

  it "can be constructed without parsing" do
    JS::Module.new.should_not be_nil
  end

  it "has a path" do
    JS::Module.new('input').path.should == 'input'
  end

  it "parses until end of block" do
    @input = StringIO.new("});", 'r')
    JS::Module.new.parse(@input, @output)
    @input.should be_eof
    @output.string.should == ""
  end

  it "detects malformed block" do
    @input = StringIO.new(")}", 'r')
    lambda {JS::Module.new.parse(@input, @output)}.should raise_error
  end

  it "requires files" do
    JS::Module.new.require_file(file('spec/input/simple.js'), @output)
    @output.string.should match(/var blarg = 'bleep';/)
  end

  it "requires files only once" do
    mod = JS::Module.new
    mod.require_file(file('spec/input/simple.js'), @output)
    mod.require_file(file('spec/input/simple.js'), @output)
    @output.string.should match(/var blarg = 'bleep';/)
    @output.string.should_not match(/blarg.*blarg/m)
  end

  it "consumes stuff inside block" do
    @input = StringIO.new(<<INPUT.rstrip, 'r')
  var x = 1;
});
INPUT
    JS::Module.new.parse(@input, @output)
    @input.should be_eof
    @output.string.should == ""
  end

  it "leaves remaining code alone" do
    @input = StringIO.new(<<INPUT, 'r')
});

var x = 1;
INPUT
    JS::Module.new.parse(@input, @output)
    @input.read.should match("var x = 1;")
    @output.string.should == ""
  end

  it "inlines requirements" do
    @input = StringIO.new(<<INPUT, 'r')
  m.require('simple.js')
});
INPUT
    JS::Module.new('jsbuild/spec/input').parse(@input, @output)
    @output.string.should match("var blarg = 'bleep';")
  end

  it "inlines sub requirements" do
    @input = StringIO.new(<<INPUT, 'r')
  m.require('require-simple.js')
});
INPUT
    JS::Module.new('jsbuild/spec/input').parse(@input, @output)
    @output.string.should match("var blarg = 'bleep';")
  end

  it "handles relative path groups" do
    @input = StringIO.new(<<INPUT, 'r')
  m.under('subdir/', function(sub) {
    sub.require('subfile.js')
  });
});
INPUT
    JS::Module.new('jsbuild/spec/input').parse(@input, @output)
    @output.string.should match("var subfile = 'subfile';")
  end
end

describe JS::Dependency do
  it "resolves a local path" do
    JS::Dependency.new('jsbuild/spec/input/simple.js').local_path.should  == file('spec/input/simple.js')
  end

  context 'building' do
    def file_contents(file)
      File.open(file) {|f| f.readlines.join}
    end

    def compare_files(input, output)
      file_contents(output).should == file_contents(input)
    end

    def expected_contents(filename)
      compare_files(file('spec/expected/' + filename), file('spec/output/' + filename))
    end

    def io_pair(filename)
      [file('spec/input/' + filename), file('spec/output/' + filename.sub('.js', '-built.js'))]
    end

    def build(filename)
      io = io_pair(filename)
      JS::Dependency.new(io.first).build(io.last)
    end

    def run(filename)
      build(filename)
      expected_contents(filename.sub(/\.js$/, '-built.js'))
    end

    before(:all) do
      FileUtils.rm Dir.glob file('spec/output/*.js');
    end

    before(:each) do
      JS::Module.clear_files
    end

    it "passes simple files through unaffected" do
      build('simple.js')
      compare_files(*io_pair('simple.js'))
    end

    it "removes multi-line modules" do
      run('multiline.js')
    end

    it "leaves remaining code alone" do
      run('codeafter.js')
    end
  
    it "inlines requirements" do
      run('require-simple.js')
    end

    it "inlines sub requirements" do
      run('require-require.js')
    end
  end
end
